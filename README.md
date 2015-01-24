# parse-sizes

A non-strict but robust javascript parser for the [HTML5 sizes] (http://www.w3.org/html/wg/drafts/html/master/embedded-content.html#attr-img-sizes) attribute, based on the [WHATWG reference algorithm] (https://html.spec.whatwg.org/multipage/embedded-content.html#parse-a-sizes-attribute). It has an extensive test suite.

The goal of this function is strong test coverage that goes beyond what is possible with a simple Reg Ex, but without the weight of a <a href="https://github.com/tabatkins/parse-css">full CSS parser</a>. Certain invalid edge-case constructs are therefore not handled. Conforms to jQuery JSCS style guidelines. Code is 1.1k compressed, 603 bytes gzipped.

I’m on twitter [@tweetywheaty](https://twitter.com/tweetywheaty).