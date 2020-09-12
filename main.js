chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request == 'scanEmail') {
        if (window.location.href.includes('mail.google.com')) {
            sendResponse(scanEmail())
        } else {
            sendResponse({'error':'Unknown Mailbox'})
        }
    } else if (request == 'scanInbox'){
        if (window.location.href.includes('mail.google.com')) {
            fetchLinks().then(emails => {
                sendResponse({'links':emails})
            })
        } else {
            sendResponse({'error':'Unknown Mailbox'})
        }
    } else if (request[0] == 'updatewindow') {
        if (window.location.href.includes('mail.google.com')) {
            var tempDoc = null;
            function loadDoc() {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    parser = new DOMParser();
                    doc = parser.parseFromString(this.responseText, "text/html");
                    var links = [];
                    [...doc.querySelectorAll("a")]
                                .filter(a => a.href.includes("http") && a.textContent!='Unsubscribe' && a.href.includes('google.com/url'))
                                .forEach(a => {
                                    var interestLink = a.href;
                                    links.push(interestLink)
                                })
                                sendResponse({'links':links})
                        }
                    };
            xhttp.open("GET", request[1], true);
            xhttp.send();
            }
            loadDoc()
        } else {
            sendResponse({'error':'Unknown Mailbox'})
        }
    } else if (request == 'checkVersion') {
        if (window.location.href.includes('mail.google.com')) { 
            if (document.getElementsByClassName('submit_as_link')[0]){
                sendResponse({'version':'new'})
            } else {
                sendResponse({'version':'old'})
            }
        } else {
            sendResponse({'version':'incompatible'})
        }
        
    } else if (request == 'changeVersion') {
        document.getElementsByClassName('submit_as_link')[0].click()
        sendResponse({'status':'done'})
    } else {
        sendResponse({'error':'Unknown Mailbox'})
    }
    return true;
    
})

async function fetchLinks(){
    return new Promise((resolve, reject) => {
        var emailsFound = false;
        var emails = [];
        var count = 0;
        try {
            [...document.querySelectorAll("tr")]
                .filter(a => (a.textContent.toLowerCase().includes('university') || a.textContent.toLowerCase().includes('undergrad') || a.textContent.toLowerCase().includes('college') || a.textContent.toLowerCase().includes('admission')) && a.textContent.length < 300 )
                .forEach(a => {
                    var link = a.getElementsByTagName('td')[2].getElementsByTagName('a')[0].href;
                    emailsFound = true;
                    count += 1
                    emails.push(link);
                })
        } catch (err) {
            console.log(err)
        }
        var checkExist = setInterval(function() {
            if (emails.length == count && emailsFound == true) {
                resolve(emails)
            } else if (emailsFound == false){
                resolve([''])
            }
         }, 1000);
    })
}

function scanEmail(){
    var scanLinks = document.getElementsByTagName('a');
    var links = [];
    for (i=0;i<scanLinks.length;i++){
        try {
            var url = scanLinks[i].getAttribute('href');
            if (url.includes("https") && scanLinks[i].textContent!='Unsubscribe' && !scanLinks[i].getAttribute('href').includes(window.location.host) && !scanLinks[i].getAttribute('href').includes('google')){
                links.push(scanLinks[i].getAttribute('href'));
            }
        } catch (err) {}
    }
    if (links){
        return({'links':links})
    } else {
        return({'error':'No Links Found'})
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}