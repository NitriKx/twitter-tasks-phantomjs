//  
//   twitter-report-user-account.js
//
//   This PhantomJS script log onto the Twitter web interface, then navigate to the target profile and then fill a report form for the target.  
//
//   Author: Benoît Sauvère
//
//   Improvements: Take a list of accounts
//
//   Usage: phantomjs --ssl-protocol tlsv1 twitter-report-user-account.js <reporterTwitterId> <reporterTwitterPassword> <targetTwitterId>
//   

// Parse script arguments
var args = require('system').args;

var inputParam_reporterTwitterId = args[1];
var inputParam_reporterTwitterPassword = args[2];
var inputParam_targetTwitterId = args[3];

var currentDate = new Date();

var steps = [


    // STEP 0 - Open Twitter login page
    {
        ready: function() {
            return true;
        },
        action: function() {
            page.open("https://twitter.com/");
        }
    },


    // STEP 1 - Log onto Twitter with the spcified credentials
    {
        ready: function() {
            return page.evaluate(step1_isReadyForAction);
        },
        action: function() {
           console.log("Logging in to your account...");
           page.evaluate(step1_fillLoginFormAndSubmitIt, inputParam_reporterTwitterId, inputParam_reporterTwitterPassword)
        }
    },


    // STEP 2 - Wait for the end of the login request. It also check if the credentials are ok.
    {
        ready: function() {
            var isStep2Ready = page.evaluate(step2_isReadyForAction);
            if (isStep2Ready == "INVALID_CREDENTIALS") {
                console.log("Invalid credentials. Please check the credentials you supplied.");
                phantom.exit(1);
            }

            return isStep2Ready;
        },

        action: function() {
            page.evaluate(step1_fillLoginFormAndSubmitIt, inputParam_reporterTwitterId, inputParam_reporterTwitterPassword)
        }
    },


    // STEP 3 - Navigate to the target profile
    {
        ready: function() {
            return true;
        },

        action: function() {
            
            page.open("https://twitter.com/" + inputParam_targetTwitterId);
        }
    },


    // STEP 4 - Click on the "Report abuse"
    {
        ready: function() {
            return page.evaluate(step4_isReadyForAction);
        },

        action: function() {
            // Click on the gear icon
            step4_action();
        }
    },


    // STEP 5 - Wait for the "gear" menu to open, and then click on "report"
    {
        ready: function() {
            return page.evaluate(step5_isReadyForAction);
        },

        action: function() {
            
            step5_action();
        }
    },


    // STEP 6 - Once the report popup displayed, we click on the checkbox to report an abuse
    {
        ready: function() {
            return page.evaluate(step6_isReadyForAction);
        },

        action: function() {
            
            step6_action();
        }
    },


    // STEP 7 - Once the form related to the checkbox is loaded, we click the option menu and send the form
    {
        ready: function() {
            return page.evaluate(step7_isReadyForAction);
        },

        action: function() {
            
            step7_action();
        }
    },

    // STEP 8 - Wait for the form to be submitted and then check that the popup is shown
    {
        ready: function() {
            return page.evaluate(step8_isReadyForAction);
        },

        action: function() {
            
            step8_action();
        }
    }

    
];




//  ------------------------------------------------------------------------
//
//    Helper functions - STEP1
//
//  ------------------------------------------------------------------------

function step1_isReadyForAction() {
    // Check if the email and password field are loaded (that means that the page finished to load)
    return $("#signin-email").size() > 0 && $("#signin-password").size() > 0 && $("div.front-signin button.submit").size() > 0;
}


function step1_fillLoginFormAndSubmitIt(reporterTwitterId, reporterTwitterPassword) {
    $("#signin-email").val(reporterTwitterId);
    $("#signin-password").val(reporterTwitterPassword);

    $("div.front-signin button.submit").click();
}



//  ------------------------------------------------------------------------
//
//    Helper functions - STEP2
//
//  ------------------------------------------------------------------------


function step2_isReadyForAction() {

    // If the credentials are invalid 
    if ( $("#message-drawer").css("display") != "none" ) {
        return "INVALID_CREDENTIALS";
    }

    return $("body.logged-in").size() > 0;
}




//  ------------------------------------------------------------------------
//
//    Helper functions - STEP4
//
//  ------------------------------------------------------------------------


function step4_isReadyForAction() {
    return $("div.ProfileAvatar").size() > 0 && $("div.ProfileAvatar").css("display") != "none";
}

function step4_action() {

    var isAlreadyBlocked = page.evaluate(step4_isAccountAlreadyBlocked);

    if (isAlreadyBlocked == false) {
        page.evaluate(step4_clickOnReportAbuseMenuOption);
    } else {
        console.log("This account has already been blocked.");
        phantom.exit(2);
    }
}


function step4_isAccountAlreadyBlocked() {
    return $(".BlockedWarningTimeline").css('display') != "none";
}


function step4_clickOnReportAbuseMenuOption() {
    $("div.ProfileNav button.user-dropdown").click();
}



//  ------------------------------------------------------------------------
//
//    Helper functions - STEP5
//
//  ------------------------------------------------------------------------


function step5_isReadyForAction() {
    return $("li.block-or-report-text button[role=menuitem]").size() > 0 && $(".block-or-report-text button[role=menuitem]").css("display") != "none";
}

function step5_action() {
    return page.evaluate(step5_checkReportCheckbox);
}

function step5_checkReportCheckbox() {
    // Open the modal popup to report an abuse over this profile
    $(".block-or-report-text button[role=menuitem]").click();
}

//  ------------------------------------------------------------------------
//
//    Helper functions - STEP6
//
//  ------------------------------------------------------------------------


function step6_isReadyForAction() {
    return $("div.report-form input[name=also_report]").size() > 0 && $("div.report-form input[name=also_report]").css('display') != "none";
}

function step6_action() {
    page.evaluate(step6_checkReportCheckbox);
}

function step6_checkReportCheckbox() {
    // Check the "also report" checkbot
    $("div.report-form input[name=also_report]").click();
}


//  ------------------------------------------------------------------------
//
//    Helper functions - STEP7
//
//  ------------------------------------------------------------------------


function step7_isReadyForAction() {
    return $("span.optional-report input[value=annoying]").size() > 0 && $("span.optional-report input[value=annoying]").css("display") != "none";
}

function step7_action() {
    page.evaluate(step7_validateReportForm);
}

function step7_validateReportForm() {
    // Click the report type
    $("span.optional-report input[value=annoying]").click();

    // Submit the form
    $("#report-control button.report-tweet-block-button").click();
}


//  ------------------------------------------------------------------------
//
//    Helper functions - STEP8
//
//  ------------------------------------------------------------------------


function step8_isReadyForAction() {
    return $("div.alert-messages div.message span.message-text").size() > 0 && $("div.alert-messages div.message span.message-text").css("display") != "none";
}

function step8_action() {
    console.log("The account " + inputParam_targetTwitterId + " has been reported");
    phantom.exit(0);
}




//  ------------------------------------------------------------------------
//
//    Common functions
//
//  ------------------------------------------------------------------------       


// This function renders the current page into a PNG file whose name depends on the stepNumber.
// Remark : When this method is called several times from the same step, each file overwrite the previous one (this avoid 
//          having the disk filled with too many useless files)
function saveRender(page, stepNumber) {
    var fileName = "phantomJSrender" + "_at-" + new Date().getTime() + "_step-" + stepNumber + ".png";
    page.render(fileName, {
        format: 'png',
        quality: '100'
    });
    console.log("A new render for step [" + stepNumber + "] is availible at [" + fileName + "]");
}




//  ------------------------------------------------------------------------
//
//    Initialisation of phantomJS
//
//  ------------------------------------------------------------------------

var webPage = require('webpage');
var page = webPage.create(),
    stepcounter = 0,
    loadInProgress = false;
page.settings.userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1468.0 Safari/537.36";
page.settings.resourceTimeout = 10000;

page.viewportSize = {
          width: 1920,
          height: 1080
        };
var tempoCpt = 0;



if (args.length != 3 + 1) {
    console.log("Usage: phantomjs --ssl-protocol tlsv1 " + args[0] + " <reporterTwitterId> <reporterTwitterPassword> <reportedTwitterId>");
    phantom.exit(255);
}

page.onConsoleMessage = function(msg) {
    console.log('BROWSER-CONSOLE - ' + msg);
    
    // If the msg contains "Error logged:" we take a screenshot
    if (msg.indexOf('Error logged:') > -1) {
        saveRender(page, stepcounter);
    }
};

page.onError = function(msg) {
    console.log('BROWSER-CONSOLE-ERROR - ' + msg);
    // If the msg contains "Error logged:" we take a screenshot
    if (msg.indexOf('Error logged:') > -1) {
        saveRender(page, stepcounter);
    }
};


//  ------------------------------------------------------------------------
//
//    CORE engine of the scrapper
//
//  ------------------------------------------------------------------------

var interval = setInterval(

        function() {
            if (!loadInProgress && (steps[stepcounter] != undefined)) {
                // Prevent double execution of a step
                if(steps[stepcounter].actionInProgress == undefined || steps[stepcounter].actionInProgress == false) {
                    if (typeof steps[stepcounter].action == "function") {
                        if (steps[stepcounter].ready() == true) {
                            console.log("Step[" + (stepcounter) + "] - Executing action.");
                            steps[stepcounter].actionInProgress = true;
                            steps[stepcounter].action();
                            steps[stepcounter].actionInProgress = false;
                            stepcounter++;
                        } else {
                            console.log("Step[" + (stepcounter) + "] - Not ready yet.");
                        }
                    }
                } else {
                    console.log("JOB RUNNING");
                }
            }
            if (steps[stepcounter] == undefined) {
                console.log("Execution complete!");
                clearInterval(interval);
            }
        },

        500);

page.onLoadStarted = function() {
    loadInProgress = true;
};

page.onLoadFinished = function() {
    loadInProgress = false;
};
var timeStart = new Date().getTime();