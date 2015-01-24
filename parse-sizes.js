/*
 * Sizes Parser
 *
 * By Alex Bell |  MIT License
 *
 * Non-strict but accurate and lightweight JS Parser for the string value <img sizes="here">
 *
 * Reference algorithm at:
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
 * or "(min-width: 30em), calc(30em - 15px)" or just "30vw"
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
	var regexCssLengthWithUnits = /^(?:[+-]?[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?(?:ch|cm|em|ex|in|mm|pc|pt|px|rem|vh|vmin|vmax|vw)$/i,

	// (This is a quick and lenient test. Because of optional unlimited-depth internal
	// grouping parens and strict spacing rules, this could get very complicated.)
	    regexCssCalc = /^calc\((?:[0-9a-z \.\+\-\*\/\(\)]+)\)$/i,
	    i, unparsedSizesList, unparsedSizesListLength, unparsedSize, lastComponentValue, size;

	// UTILITY FUNCTIONS

	// ( Manual is faster than RegEx.)
	// http://jsperf.com/whitespace-character/5
	function isSpace(c) {
		return (c === "\u0020" || // space
		        c === "\u0009" || // horizontal tab
		        c === "\u000A" || // new line
		        c === "\u000C" || // form feed
		        c === "\u000D");  // carriage return
	}

	//  (Toy CSS parser. The goals here are:
	//  1) expansive test coverage without the weight of a full CSS parser.
	//  2) Avoiding regex wherever convenient.
	//  Quick tests: http://jsfiddle.net/gtntL4gr/3/
	//  Returns an array of arrays.)
	function parseComponentValues(str) {
		var chrctr,
		    component = "",
		    componentArray = [],
		    listArray = [],
		    parenDepth = 0,
		    pos = 0,
		    inComment = false;

		function pushComponent() {
			if (component) {
				componentArray.push(component);
				component = "";
			}
		}

		function pushComponentArray() {
			if (componentArray[ 0 ]) {
				listArray.push(componentArray);
				componentArray = [];
			}
		}

		// (Loop forwards from the beginning of the string.)
		while (true) {
			chrctr = str[ pos ];

		if (chrctr === undefined) { // ( End of string reached.)
			pushComponent();
			pushComponentArray();
			return listArray;
		} else if (inComment) {
			if ((chrctr === "*") && (str[ pos + 1 ] === "/")) { // (At end of a comment.)
				inComment = false;
				pos += 2;
				pushComponent();
				continue;
			} else {
				pos += 1; // (Skip all characters inside comments.)
				continue;
			}
		} else if (isSpace(chrctr)) {
			// (If previous character in loop was also a space, or if
			// at the beginning of the string, do not add space char to
			// component.)
			if ((str[ pos - 1 ] && isSpace(str[ pos - 1 ])) || (!component)) {
				pos += 1;
				continue;
			} else if (parenDepth === 0) {
				pushComponent();
				pos += 1;
				continue;
			} else {
				// (Replace any space character with a plain space for legibility.)
				chrctr = " ";
			}
		} else if (chrctr === "(") {
			parenDepth += 1;
		} else if (chrctr === ")") {
			parenDepth -= 1;
		} else if (chrctr === ",") {
			pushComponent()
			pushComponentArray();
			pos += 1;
			continue;
		} else if ((chrctr === "/") && (str[ pos + 1 ] === "*")) {
			inComment = true;
			pos += 2;
			continue;
		}

		component = component + chrctr;
		pos += 1;
		}
	}

	function isValidNonNegativeSourceSizeValue(s) {
		if (regexCssLengthWithUnits.test(s) && (parseFloat(s) >= 0)) {return true;}
		if (regexCssCalc.test(s)) {return true;}
		// ( http://www.w3.org/TR/CSS2/syndata.html#numbers says:
		// "-0 is equivalent to 0 and is not a negative number." which means that
		// unitless zero and unitless negative zero must be accepted as special cases.)
		if ((s === "0") || (s === "-0") || (s === "+0")) {return true;}
		return false;
	}

	// When asked to parse a sizes attribute from an element, parse a
	// comma-separated list of component values from the value of the element's
	// sizes attribute (or the empty string, if the attribute is absent), and let
	// unparsed sizes list be the result.
	// http://dev.w3.org/csswg/css-syntax/#parse-comma-separated-list-of-component-values

	unparsedSizesList = parseComponentValues(strValue);
	unparsedSizesListLength = unparsedSizesList.length;

// For each unparsed size in unparsed sizes list:
	for (i = 0; i < unparsedSizesListLength; i++) {
		unparsedSize = unparsedSizesList[ i ];

		// 1. Remove all consecutive <whitespace-token>s from the end of unparsed size.
		// ( parseComponentValues() already omits spaces outside of parens. )

		// If unparsed size is now empty, that is a parse error; continue to the next
		// iteration of this algorithm.
		// ( parseComponentValues() won't push an empty array. )

		// 2. If the last component value in unparsed size is a valid non-negative
		// <source-size-value>, let size be its value and remove the component value
		// from unparsed size. Any CSS function other than the calc() function is
		// invalid. Otherwise, there is a parse error; continue to the next iteration
		// of this algorithm.
		// http://dev.w3.org/csswg/css-syntax/#parse-component-value
		lastComponentValue = unparsedSize[ unparsedSize.length - 1 ];

		if (isValidNonNegativeSourceSizeValue(lastComponentValue)) {
			size = lastComponentValue;
			unparsedSize.pop();
		} else if (window.console && console.log) {
			console.log("Parse error: " + strValue);
			continue;
		}

		// 3. Remove all consecutive <whitespace-token>s from the end of unparsed
		// size. If unparsed size is now empty, return size and exit this algorithm.
		// If this was not the last item in unparsed sizes list, that is a parse error.
		if (unparsedSize.length === 0) {
			if ((i !== unparsedSizesListLength - 1) && window.console && console.log) {
				console.log("Parse error: " + strValue);
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
		unparsedSize = unparsedSize.join(" ");
		if (!(window.matchMedia(unparsedSize).matches) ) {
			continue;
		}

		// 5. Return size and exit this algorithm.
		return size;
	}

	// If the above algorithm exhausts unparsed sizes list without returning a
	// size value, return 100vw.
	return "100vw";
}
