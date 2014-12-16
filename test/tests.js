// Very loosely adapted from the W3C 'sizes' conformance checker at:
// http://w3c-test.org/html/semantics/embedded-content/the-img-element/sizes/parse-a-sizes-attribute.html
// Certain Invalid constructs like matching (), [] and {} are deliberately not handled.

var tests = [
	{
		groupName: "No media condition",
		testArray: [
			{sizes: '',                          expect: '100vw', desc: "empty string"},
			{sizes: ',',                         expect: '100vw', desc: "single comma"},
			{sizes: '-1px',                      expect: '100vw'},
			{sizes: '1',                         expect: '100vw'}, 
			{sizes: '100vw',                     expect: '100vw'},
			{sizes: '50vh',                      expect: '50vh'},
			{sizes: '050ch',                     expect: '050ch', desc: "leading zero"},
			{sizes: '1px',                       expect: '1px'},
			{sizes: '0',                         expect: '0'},
			{sizes: '-0',                        expect: '-0'},
			{sizes: '+0',                        expect: '+0', desc: "plus zero"},
			{sizes: '+1px',                      expect: '+1px'},
			{sizes: '.1px',                      expect: '.1px'},
			{sizes: '0.1em',                     expect: '0.1em'},
			{sizes: '0.1ex',                     expect: '0.1ex'},
			{sizes: '0.1ch',                     expect: '0.1ch'},
			{sizes: '0.1rem',                    expect: '0.1rem'},
			{sizes: '0.1vw',                     expect: '0.1vw'},
			{sizes: '0.1vh',                     expect: '0.1vh'},
			{sizes: '0.1vmin',                   expect: '0.1vmin'},
			{sizes: '0.1vmax',                   expect: '0.1vmax'},
			{sizes: '0.1cm',                     expect: '0.1cm'},
			{sizes: '1mm',                       expect: '1mm'},
			{sizes: '1q',                        expect: '100vw'},
			{sizes: '0.01in',                    expect: '0.01in'},
			{sizes: '0.1pc',                     expect: '0.1pc'},
			{sizes: '0.1pt',                     expect: '0.1pt'},
			{sizes: '(),1px',                    expect: '1px'},
			{sizes: 'x(),1px',                   expect: '1px'},
			{sizes: '{},1px',                    expect: '1px'},
			{sizes: '[],1px',                    expect: '1px'},
			{sizes: '1px,(',                     expect: '1px'},
			{sizes: '1px,x(',                    expect: '1px'},
			{sizes: '1px,{',                     expect: '1px'},
			{sizes: '1px,[',                     expect: '1px'},
			{sizes: '25vw, 1px',                 expect: '25vw'}
		]
	},
	{
		groupName: "calc() function",
		testArray: [
			{sizes: 'calc(1px)',                 expect: 'calc(1px)'},
			{sizes: ' calc(5px + 5px)',          expect: 'calc(5px + 5px)'},
			{sizes: 'calc((5px + 5px)*2)',       expect: 'calc((5px + 5px)*2)'},
			{sizes: 'calc(200px * 1.4)',         expect: 'calc(200px * 1.4)', desc: "floats in calc 1"},
			{sizes: 'calc(20.2em + 10px)',       expect: 'calc(20.2em + 10px)', desc: "floats in calc 2"}
		]
	},
	{
		groupName: "Disallowed css-length units",
		testArray: [	
			{sizes: '0.1%',    expect: '100vw'},  
			{sizes: '0.1deg',  expect: '100vw'},  
			{sizes: '0.1grad', expect: '100vw'},  
			{sizes: '0.1rad',  expect: '100vw'},
			{sizes: '0.1turn', expect: '100vw'},
			{sizes: '0.1s',    expect: '100vw'},
			{sizes: '0.1ms',   expect: '100vw'},
			{sizes: '0.1Hz',   expect: '100vw'},
			{sizes: '0.1kHz',  expect: '100vw'},
			{sizes: '0.1dpi',  expect: '100vw'},
			{sizes: '0.1dpcm', expect: '100vw'},
			{sizes: '0.1dppx', expect: '100vw'}
		]
	},
	{
		groupName: "CSS style comments",
		testArray: [
			{sizes: '/* */1px/* */',             expect: '1px'},
			{sizes: ' /**/ /**/ 1px /**/ /**/ ', expect: '1px'},
			// Comment should break into two component values, much like a space.
			{sizes: '1/* */px',                  expect: '100vw'},
			{sizes: '1p/* */x',                  expect: '100vw'},
			{sizes: '5/* */67px',                expect: '100vw'},
			{sizes: '-/**/0',                    expect: '100vw'},
			{sizes: '/* 50vw',                   expect: '100vw', desc: "unclosed comment"},
		]
	},
	{
		groupName: "Media condition",
		testArray: [
			{sizes: '(min-width: 5px) 30vw, 50vw',   expect: '30vw'},
			{sizes: '(min-width:0) calc(1px)',       expect: 'calc(1px)'},
			{sizes: '(min-width:calc(0)) 1px',       expect: '100vw'},
			{sizes: '(min-width:0) 1px, 100vw',      expect: '1px'},
			{sizes: '(min-width:0) 1px, (min-width:0) 100vw, 100vw', expect: '1px'},
			{sizes: '(min-width:0) 1px',             expect: '1px'},
			{sizes: 'not (min-width:0) 100vw, 1px',  expect: '1px'},
			{sizes: '(min-width:unknown-mf-value) 100vw, 1px', expect: '1px'},
			{sizes: 'not (min-width:unknown-mf-value) 1px',    expect: '100vw'},
			{sizes: '(min-width:-1px) 100vw, 1px',             expect: '1px'},
			{sizes: 'not (min-width:-1px) 1px',      expect: '100vw'},
			{sizes: '(unknown-mf-name) 100vw, 1px',  expect: '1px'},
			{sizes: 'not (unknown-mf-name) 1px',     expect: '100vw'},
			{sizes: '("unknown-general-enclosed") 100vw, 1px', expect: '1px'},
			{sizes: 'not ("unknown-general-enclosed") 1px', expect: '100vw'},
			{sizes: 'unknown-general-enclosed(foo) 100vw, 1px', expect: '1px'},
			{sizes: 'not unknown-general-enclosed(foo) 1px', expect: '100vw'},
			{sizes: 'print 100vw, 1px',              expect: '1px'},
			{sizes: 'not print 100vw, 1px',          expect: '100vw'},
			{sizes: 'unknown-media-type 100vw, 1px', expect: '1px'},
			{sizes: 'not unknown-media-type 100vw, 1px', expect: '100vw'}
		]
	},
	{
		groupName: "Compound media conditions",
		testArray: [
			{sizes: '(min-width:1px) and (min-width:1px) 1px', expect: '1px'},
			// "all" is allowed in a <media-query> but not allowed in a <media-condition>.
			// However there is no easy way to evaluate a <media-condition> as opposed to
			// a media query. These tests will currently fail. See Issue #3
			{sizes: 'all and (min-width:0) 100vw, 1px',        expect: '1px'},
			{sizes: 'all and (min-width:0) 1px',               expect: '100vw'},
			// "or" from Media Queries Level 4 is not yet implemented in any browser
			// http://dev.w3.org/csswg/mediaqueries4/#typedef-media-or
			// https://code.google.com/p/chromium/issues/detail?id=442449
			// So the first eight tests here which use it will not pass.
			{sizes: '(min-width:0) or (min-width:0) 1px', expect: '1px'},
			{sizes: '(min-width:0) or (unknown-mf-name) 1px', expect: '1px'},
			{sizes: '(min-width:0) or (min-width:unknown-mf-value) 1px', expect: '1px'},
			{sizes: '(min-width:0) or (min-width:-1px) 1px', expect: '1px'},
			{sizes: '(min-width:0) or ("unknown-general-enclosed") 1px', expect: '1px'},
			{sizes: '(min-width:0) or unknown-general-enclosed(foo) 1px', expect: '1px'},
			{sizes: '(min-width:0) or (!) 100vw, 1px', expect: '100vw'},
			{sizes: '(min-width:0) or unknown-media-type 100vw, 1px', expect: '100vw'},
			{sizes: '(123) 100vw, 1px',          expect: '1px'},
			{sizes: 'not (123) 1px',             expect: '100vw'},
			{sizes: '(!) 100vw, 1px',            expect: '1px'},
			{sizes: 'not (!) 100vw, 1px',        expect: '1px'},
			{sizes: '! 100vw, 1px',              expect: '1px'},
			{sizes: 'not ! 100vw, 1px',          expect: '1px'},
			{sizes: '(]) 100vw, 1px',            expect: '1px'},
			{sizes: 'not (]) 100vw, 1px',        expect: '1px'},
			{sizes: '] 100vw, 1px',              expect: '1px'},
			{sizes: 'not ] 100vw, 1px',          expect: '1px'},
			{sizes: '(}) 100vw, 1px',            expect: '1px'},
			{sizes: 'not (}) 100vw, 1px',        expect: '1px'},
			{sizes: '} 100vw, 1px',              expect: '1px'},
			{sizes: 'not } 100vw, 1px',          expect: '1px'},
			{sizes: ') 100vw, 1px',              expect: '1px'},
			{sizes: 'not ) 100vw, 1px',          expect: '1px'},
			{sizes: '(;) 100vw, 1px',            expect: '1px'},
			{sizes: 'not (;) 100vw, 1px',        expect: '1px'},
			{sizes: '(.) 100vw, 1px',            expect: '1px'},
			{sizes: 'not (.) 1px',               expect: '100vw'},
			{sizes: '; 100vw, 1px',              expect: '1px'},
			{sizes: 'not ; 100vw, 1px',          expect: '1px'},
			{sizes: ', 1px',                     expect: '1px'},
			{sizes: '1px,',                      expect: '1px'}
		]
	},
	{
		groupName: "Eccentric syntax",
		testArray: [
			{sizes: '(min-width:0) 55px,,,,,',   expect: '55px', desc: "multiple trailing commas"},
			{sizes: ',,,,(min-width:0) 55px',    expect: '55px', desc: "multiple leading commas"},
			{sizes: '-0e-0px',                   expect: '-0e-0px'}, // seems legit ?!
			{sizes: '+0.11e+01px',               expect: '100vw'},
			{sizes: '0.2e1px',                   expect: '0.2e1px'},
			{sizes: '0.3E1px',                   expect: '0.3E1px'},
			{sizes: '.4E1px',                    expect: '.4E1px'},
			{sizes: 'all 100vw, 1px',            expect: '100vw'},
			{sizes: 'min-width:0 100vw, 1px',    expect: '1px'},
			{sizes: '1px, 100vw',                expect: '1px'},
			{sizes: '1px, (min-width:0) 100vw',  expect: '1px'},
			{sizes: '1px, foo bar',              expect: '1px'},
			{sizes: '(min-width:0) 1px, foo bar', expect: '1px'},
			{sizes: '100vw',                     expect: '100vw'},
			{sizes: 'attr(data-foo, length, 1px)', expect: '100vw'},
			{sizes: 'attr(data-foo, px, 1px)',   expect: '100vw'},
			{sizes: 'toggle(1px)',               expect: '100vw'},
			{sizes: 'inherit',                   expect: '100vw'},
			{sizes: 'auto',                      expect: '100vw'},
			{sizes: 'initial',                   expect: '100vw'},
			{sizes: 'unset',                     expect: '100vw'},
			{sizes: 'default',                   expect: '100vw'},
			{sizes: '1px !important',            expect: '100vw'},
			{sizes: '\\1px',                     expect: '100vw'},
			{sizes: 'all 1px',                   expect: '1px'},
			{sizes: 'min-width:0 1px',           expect: '100vw'},
			{sizes: '50vw, (min-width:0) 1px',   expect: '50vw'},
			{sizes: 'foo bar',                   expect: '100vw'},
			{sizes: 'foo-bar',                   expect: '100vw'},
			{sizes: '(min-width:0) 1px foo bar', expect: '100vw'},
			{sizes: '(min-width:0) 0.1%',        expect: '100vw'},
			{sizes: '(min-width:0) 1',           expect: '100vw'},
			{sizes: '-1e0px',                    expect: '100vw'},
			{sizes: '1e1.5px',                   expect: '100vw'},
			{sizes: 'var(--foo)',                expect: '100vw'},
			{sizes: 'calc(1px',                  expect: '100vw'},
			{sizes: '(min-width:0) calc(1px',    expect: '100vw'}
		]
	}
];