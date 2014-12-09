// Keep tests in order, for sanity.
QUnit.config.reorder = false;

function runTest(test) {
	var origAttr = test.sizes;
	var parsed = parseSizes(origAttr);

	QUnit.test( (test.desc || origAttr) , function( assert ) {
		assert.equal(parsed, test.expect, "passed" );
	});
}

function runTestGroup(testGroup) {
	// Group Tests
	QUnit.module( testGroup.groupName );

	var testArray = testGroup.testArray;
	for (var j = 0; j < testArray.length; j++) {
		runTest(testArray[j]);
	}
}

var testsLength = tests.length;

for (var i = 0; i < testsLength; i++) {
		runTestGroup(tests[i]);
}

