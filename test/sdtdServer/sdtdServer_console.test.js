Feature('SdtdServer Console');

xScenario('Go to console', (I, consolePage) => {
    I.login('CSMMTesterFixture', 'something');
    I.goToTestServerConsole();
    I.see('Console');
    I.seeElement('.console-window');
    I.seeElement('.console-send-box');
});

xScenario('Execute help command', (I, consolePage) => {
    I.login('CSMMTesterFixture', 'something');
    I.goToTestServerConsole();
    consolePage.executeCommand('help');
    I.waitForElement('.log-line', 10);
    I.see('*** Generic Console Help ***');
});


xScenario('Execute unknown command', (I, consolePage) => {
    I.login('CSMMTesterFixture', 'something');
    I.goToTestServerConsole();
    consolePage.executeCommand('commandWhichDoesNotExist');
    I.waitForElement('.log-line', 10);
    I.dontSee('Executing command');
    //I.see('Unknown command');
})