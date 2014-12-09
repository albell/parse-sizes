/*
 * Sizes Parser
 *
 * By Alex Bell |  MIT License
 *
 * JS Parser for the string value that appears in markup <img sizes="here">
 *
 * Closely based on the reference algorithm at:
 * https://html.spec.whatwg.org/multipage/embedded-content.html#parse-a-sizes-attribute
 *
 * Most comments are copied in directly from the spec
 * (except for comments in parens).
 *
 * Grammar is:
 * <source-size-list> = <source-size># [ , <source-size-value> ]? | <source-size-value>
 * <source-size> = <media-condition> <source-size-value>
 * <source-size-value> = <length>
 * http://www.w3.org/html/wg/drafts/html/master/embedded-content.html#attr-img-sizes
 *
 * E.g. "(max-width: 30em) 100vw, (max-width: 50em) 70vw, 100vw"
 * or "(min-width: 30em), calc(30% - 15px)" or just "30vw"
 *
 * Returns the first valid <css-length> with a media condition that evaluates to true,
 * or "100vw" if all valid media conditions evaluate to false.
 *
 */

function parseSizes(strValue) {

	// (Percentage CSS lengths are not allowed in this case, to avoid confusion:
	// https://html.spec.whatwg.org/multipage/embedded-content.html#valid-source-size-list
	// CSS allows a single optional plus or minus sign:
	// http://www.w3.org/TR/CSS2/syndata.html#numbers
	// CSS is ASCII case-insensitive:
	// http://www.w3.org/TR/CSS2/syndata.html#characters )
	// Spec allows exponential notation for <number> type:
	// http://dev.w3.org/csswg/css-values/#numbers
	var regexCssLengthWithUnits = /^(?:[+-]?[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?(?:ch|cm|em|ex|in|mm|pc|pt|px|rem|vh|vmin|vmax|vw)$/i;
	
	// (This is a quick and lenient test. Because of optional unlimited-depth internal
	// grouping parens and strict spacing rules, this could get very complicated.)
	var regexCssCalc = /^calc\((?:[0-9a-z \+\-\*\/\(\)]+)\)$/i;

	var pError = false;
	var i;
	var unParsedSizes;
	var unParsedSizesLength;
	var unParsedSize;
	var lastComponentValue;
	var size;

	// UTILITY FUNCTIONS

	// ( Manual is faster than RegEx.)
	// http://jsperf.com/whitespace-character/5
	function isSpace(c){
		return (c === '\u0020' || // space
		        c === '\u0009' || // horizontal tab
		        c === '\u000A' || // new line
		        c === '\u000C' || // form feed
		        c === '\u000D');  // carriage return
	}
	
	// Don't use native trim(). We need deep support, and a specific list
	// of space characters. Also, 'for' loop is faster in many browsers:
	// http://jsperf.com/mega-trim-test/7
	// http://blog.stevenlevithan.com/archives/faster-trim-javascript
	function trimTrailingSpace(str) {
		var c;
    for (var j = str.length - 1; j >= 0; j--) {
        c = str[j];
        if (isSpace(c)) { continue; } else { break;}
    }
    return str.substring(0, j + 1);
	}

	function trimLeadingSpace(str) {
		var c;
    for (var i = 0; i < str.length; i++) {
        c = str[i];
        if (isSpace(c)) { continue; } else { break;}
    
    }
    return str.substring(i);
	}

	//  Toy CSS source-size parser. The goals here are: 
	//  1) expansive test coverage without the weight of a full CSS parser.
	//  2) Avoiding regex wherever convenient.
	function getLastComponentValue(str) {
		var char;
		var component = "";
		var parenDepth = 0;
		var pos = str.length - 1;

	// For simplicity, loop backwards from the end of the string
		while (true) {
			char = str[pos];
			
			if (char === undefined) { // (Beginning of string reached.)
				return component;		
			} else if (isSpace(char)) {
				// (If previous character in loop was also a space, or if
				// at the end of the string, do not add space char to
				// component.)
				if ((str[pos+1] && isSpace(str[pos+1])) || (pos === str.length -1)) {
					pos -= 1;
					continue;
				} else if ((parenDepth === 0) && component) {
					return component;
				} else {
					// (Replace a space character with a plain space for legibility.)
					char = " ";	
				}
			} else if (char === ")") {
				parenDepth += 1;
			} else if (char === "(") {
				parenDepth -= 1;								
			}
			
			component = char + component;
			pos -= 1;
		}
	}
	
	function isValidNonNegativeSourceSizeValue(s) {
	// ( http://www.w3.org/TR/CSS2/syndata.html#numbers says:
	// "-0 is equivalent to 0 and is not a negative number." which means
	// that unitless zero and unitless negative zero must be accepted as
	// special cases.)
		if (regexCssLengthWithUnits.test(s) && (parseFloat(s) >= 0)) {
			return true;
		} else if (regexCssCalc.test(s) || (s === "0") || (s === "-0") || (s === "+0")) {
			return true;
		}
		return false;
	}

	// When asked to parse a sizes attribute from an element, parse a
	// comma-separated list of component values from the value of the element's
	// sizes attribute (or the empty string, if the attribute is absent), and let
	// unparsed sizes list be the result.
  // http://dev.w3.org/csswg/css-syntax/#parse-comma-separated-list-of-component-values
	unParsedSizes = strValue.split(",");
	unParsedSizesLength = unParsedSizes.length;

// For each unparsed size in unparsed sizes list:
	for (i = 0; i < unParsedSizesLength; i++) {
		unParsedSize = unParsedSizes[i];

		// 1. Remove all consecutive <whitespace-token>s from the end of unparsed size.		
		unParsedSize = trimTrailingSpace(unParsedSize);
		
		// If unparsed size is now empty, that is a parse error; continue to the next
		// iteration of this algorithm.
		if (unParsedSize === "") { pError = true; continue; }
		
		// 2. If the last component value in unparsed size is a valid non-negative
		// <source-size-value>, let size be its value and remove the component value
		// from unparsed size. Any CSS function other than the calc() function is
		// invalid. Otherwise, there is a parse error; continue to the next iteration
		// of this algorithm.
		// http://dev.w3.org/csswg/css-syntax/#parse-component-value
		lastComponentValue = getLastComponentValue(unParsedSize);
		
		if (isValidNonNegativeSourceSizeValue(lastComponentValue)) {
			size = lastComponentValue;
			unParsedSize = unParsedSize.substring(0, unParsedSize.length - size.length);
		} else {
			pError = true;
			continue;
		}
		
		// 3. Remove all consecutive <whitespace-token>s from the end of unparsed
		// size. If unparsed size is now empty, return size and exit this algorithm.
		// If this was not the last item in unparsed sizes list, that is a parse error.
		unParsedSize = trimTrailingSpace(unParsedSize);
		if (unParsedSize === "") {
			if ((i !== unParsedSizesLength -1) && window.console && console.log) {
				console.log("Parse error: " + unParsedSizes);
			}
			return size;
		}

		// 4. Parse the remaining component values in unparsed size as a
		// <media-condition>. If it does not parse correctly, or it does parse
		// correctly but the <media-condition> evaluates to false, continue to the
		// next iteration of this algorithm.
		// (Parsing all possible compound media conditions in JS is heavy, complicated,
		// and the payoff is unclear. Is there ever an situation where the
		// media condition parses incorrectly but still somehow evaluates to true?
		// Can we just rely on the browser/polyfill to do it?)
		unParsedSize = trimTrailingSpace(unParsedSize);
		unParsedSize = trimLeadingSpace(unParsedSize);
		
		if (!(window.matchMedia(unParsedSize).matches) ) {
			continue;		
		}

		// 5. Return size and exit this algorithm.
		return size;
	}

	// If the above algorithm exhausts unparsed sizes list without returning a
	// size value, return 100vw.
	return '100vw';
}
