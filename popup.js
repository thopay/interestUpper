document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({currentWindow: true, active: true},
        function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, 'checkVersion', updateScanInbox)
        }
    )
    var openedTabs = 0;
    var taskCount = 0;
    var scraping = false;
    var completedTasks = 0;
    document.getElementById('singleButton').addEventListener('click',
    singleEmail, false)
    function singleEmail() {
        document.getElementById('inboxInfo').style.display = 'none'
        var button = document.getElementById('inboxButton');
        button.style.display = 'none';
        var button = document.getElementById('singleButton');
        button.setAttribute('disabled','disabled');
        button.classList.replace('btn-primary','btn-warning');
        document.getElementById('statusSingle').style.display = 'none';
        document.getElementById('loading').style.display = '';
        chrome.tabs.query({currentWindow: true, active: true},
            function(tabs){
                chrome.tabs.sendMessage(tabs[0].id, 'scanEmail', openLinks)
            })
    }
    async function scanInbox() {
        var button = document.getElementById('singleButton');
        button.style.display = 'none'
        var button = document.getElementById('inboxButton');
        button.setAttribute('disabled','disabled');
        button.classList.replace('btn-primary','btn-warning');
        document.getElementById('statusInbox').style.display = 'none';
        document.getElementById('inboxLoading').style.display = '';
        chrome.tabs.query({currentWindow: true, active: true},
            function(tabs){
                chrome.tabs.sendMessage(tabs[0].id, 'scanInbox', queueLinks)
            })
    }

    function queueLinks(res){
        taskCount = res.links.length
        res.links.forEach(async link => {
            while (scraping == true){
                await sleep(1000)
            }
            chrome.tabs.query({currentWindow: true, active: true},
                function(tabs){
                    chrome.tabs.sendMessage(tabs[0].id, ['updatewindow',link], swagLinks)
                    
                })
            scraping = true
        })
    }

    async function updateScanInbox(res){
        if (res.version == 'old') {
            var button = document.getElementById('inboxButton');
            button.style.display = '';
            button.classList.replace('btn-danger','btn-primary');
            document.getElementById('inboxInfo').textContent = "To scan the currently visible emails, click the 'Scan Inbox' button."
            document.getElementById('inboxInfo').style.display = '';
            document.getElementById('inboxInfo').style.color = 'green';
            document.getElementById('inboxButton').addEventListener('click', scanInbox, false)
        } else if (res.version == 'new') {
            document.getElementById('inboxInfo').style.display = '';
            var button = document.getElementById('inboxButton');
            button.style.display = '';
            document.getElementById('inboxButton').addEventListener('click', async () => {
                chrome.tabs.query({currentWindow: true, active: true},
                    function(tabs){
                        chrome.tabs.sendMessage(tabs[0].id, 'changeVersion', (res) => {
                            if (res.status == 'done'){
                                [...document.getElementsByClassName('mut')].forEach(e => {
                                    e.style.display = 'none';
                                });
                                [...document.getElementsByClassName('reveal')].forEach(e => {
                                    e.style.display = '';
                                })
                            }
                        })
                    }
                )
            }, false)
        } 
    }

    async function swagLinks(res){
        if (res.links){
            fewOpenLinks(res).then(()=>{
                scraping = false
            })
        }
    }

    async function fewOpenLinks(res) {
        return new Promise(async (resolve, reject) => { 
            try {
                if (res.links.length > 0){
                    var e = res.links;
                    e.forEach(i => {
                        var newTab = chrome.tabs.create({url:i, active: false}, callBack);
                        openedTabs += 1;
                    })
                    while (openedTabs>0){
                        await sleep(500);
                    }
                    resolve()
                    completedTasks  += 1
                    var progressBar = document.getElementById('progressBar');
                    var progress = (completedTasks/taskCount)*100
                    progressBar.style.width = progress + '%';
                    progressBar.setAttribute('aria-valuenow',progress)
                    if (completedTasks == taskCount){
                        progressBar.classList.remove('progress-bar-striped');
                        progressBar.classList.remove('progress-bar-animated');
                        progressBar.classList.add('bg-success');
                        document.getElementById('statusInbox').style.display = '';
                        document.getElementById('loading').style.display = 'none';
                        var button = document.getElementById('inboxButton');
                        button.classList.replace('btn-warning','btn-success');
                        button.textContent = 'Completed';
                    }
                } else {
                    document.getElementById('statusInbox').style.display = '';
                    document.getElementById('loading').style.display = 'none';
                    var button = document.getElementById('inboxButton');
                    button.classList.replace('btn-warning','btn-danger');
                    button.textContent = 'No Emails Found';
                }
            } catch (err) {
                document.getElementById('statusInbox').style.display = '';
                document.getElementById('loading').style.display = 'none';
                var button = document.getElementById('inboxButton');
                button.setAttribute('disabled','');
                button.classList.replace('btn-warning','btn-danger');
                button.textContent = 'Error';
            }
        })
        
    }

    async function openLinks(res) {
        try {
            if (res.links.length > 0){
                var e = res.links;
                e.forEach(i => {
                    var newTab = chrome.tabs.create({url:i, active: false}, callBack);
                    openedTabs += 1;
                })
                var check = openedTabs;
                var progressBar = document.getElementById('progressBar');
                
                while (openedTabs>0){
                    await sleep(500);
                    var progress = ((check - openedTabs)/openedTabs)*100;
                    progressBar.style.width = progress + '%';
                    progressBar.setAttribute('aria-valuenow',progress)
                }
                progressBar.classList.remove('progress-bar-striped');
                progressBar.classList.remove('progress-bar-animated');
                progressBar.classList.add('bg-success');
                document.getElementById('statusSingle').style.display = '';
                document.getElementById('loading').style.display = 'none';
                var button = document.getElementById('singleButton');
                button.classList.replace('btn-warning','btn-success');
                button.textContent = 'Completed';
            } else if (res.links.length == 0) {
                document.getElementById('statusSingle').style.display = '';
                document.getElementById('loading').style.display = 'none';
                var button = document.getElementById('singleButton');
                button.setAttribute('disabled','');
                button.classList.replace('btn-warning','btn-danger');
                button.textContent = 'No Emails Found';
            } else if (res.error == 'Unknown Mailbox') {
                document.getElementById('statusSingle').style.display = '';
                document.getElementById('loading').style.display = 'none';
                var button = document.getElementById('singleButton');
                button.setAttribute('disabled','');
                button.classList.replace('btn-warning','btn-danger');
                button.textContent = 'Unknown Mailbox';
            } else if (res.error == 'No Links Found') {
                document.getElementById('statusSingle').style.display = '';
                document.getElementById('loading').style.display = 'none';
                var button = document.getElementById('singleButton');
                button.setAttribute('disabled','');
                button.classList.replace('btn-warning','btn-danger');
                button.textContent = 'No Links Found';
            }
        } catch (err) {
            document.getElementById('statusSingle').style.display = '';
            document.getElementById('loading').style.display = 'none';
            var button = document.getElementById('singleButton');
            button.setAttribute('disabled','');
            button.classList.replace('btn-warning','btn-danger');
            button.textContent = 'Error';
        }
        
        
    }

    function callBack(tab){
        var tabId = tab.id;
        chrome.tabs.onUpdated.addListener(function (tabId , info) {
            if (info.status === 'complete' && tabId === tab.id) {
              chrome.tabs.remove(tabId)
              openedTabs -= 1;
            }
          });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
})