var BCLS = (function(window, document) {
    var accountId,
        clientId,
        clientSecret,
        // api stuff
        proxyURL = 'https://solutions.brightcove.com/bcls/bcls-proxy/mrss-proxy.php',
        baseURL = 'https://cms.api.brightcove.com/v1/accounts/',
        sort,
        sortDirection = "",
        search,
        limit = 25,
        totalVideos = 0,
        totalCalls = 0,
        callNumber = 0,
        superSet = 0,
        superSetVideos = 100,
        videosCompleted = 0,
        videosArray = [],
        summaryData = {},
        csvStr,
        summaryCsvStr,
        // elements
        account_id = document.getElementById('account_id'),
        client_id = document.getElementById('client_id'),
        client_secret = document.getElementById('client_secret'),
        makeReport = document.getElementById('makeReport'),
        warning = document.getElementById('warning'),
        content,
        logger = document.getElementById('logger'),
        logText = document.getElementById('logText'),
        csvSummaryData = document.getElementById('csvSummaryData'),
        csvData = document.getElementById('csvData'),
        summaryReport = document.getElementById('summaryReport'),
        detailedReport = document.getElementById('detailedReport'),
        apiRequest = document.getElementById('apiRequest'),
        allButtons = document.getElementsByName('button'),
        pLogGettingVideoSets = document.createElement('p'),
        pLogGettingRenditions = document.createElement('p'),
        pLogFinish = document.createElement('p'),
        spanIntro1 = document.createElement('span'),
        spanOf1 = document.createElement('span'),
        spanIntro2 = document.createElement('span'),
        spanOf2 = document.createElement('span'),
        spanSetsTotal = document.createElement('span'),
        spanSetsCount = document.createElement('span'),
        spanVideosTotal = document.createElement('span'),
        spanVideosCount = document.createElement('span'),
        reportTable = document.createElement('table'),
        summaryReportTable = document.createElement('table'),
        reportTableHead = document.createElement('thead'),
        summaryTableHead = document.createElement('thead'),
        reportTableBody = document.createElement('tbody'),
        summaryTableBody = document.createElement('tbody'),
        spanSetsTotalEl,
        spanSetsCountEl,
        spanVideosTotalEl,
        spanVideosCountEl;

    /**
     * tests for all the ways a variable might be undefined or not have a value
     * @param {String|Number} x the variable to test
     * @return {Boolean} true if variable is defined and has a value
     */
    function isDefined(x) {
        if (x === '' || x === null || x === undefined) {
            return false;
        }
        return true;
    }

    /**
     * get selected value for single select element
     * @param {htmlElement} e the select element
     */
    function getSelectedValue(e) {
        return e.options[e.selectedIndex].value;
    }

    /**
     * disables all buttons so user can't submit new request until current one finishes
     */
    function disableButtons() {
        var i,
            iMax = allButtons.length;
        for (i = 0; i < iMax; i++) {
            allButtons[i].setAttribute('disabled', 'disabled');
        }
    }

    /**
     * re-enables all buttons
     */
    function enableButtons() {
        var i,
            iMax = allButtons.length;
        for (i = 0; i < iMax; i++) {
            allButtons[i].removeAttribute('disabled');
        }
    }

    /**
     * sort an array of objects based on an object property
     * @param {array} targetArray - array to be sorted
     * @param {string|number} objProperty - object property to sort on
     * @return sorted array
     */
    function sortArray(targetArray, objProperty) {
        targetArray.sort(function(a, b) {
            var propA = a[objProperty],
                propB = b[objProperty];
            // sort ascending; reverse propA and propB to sort descending
            if (propA < propB) {
                return -1;
            } else if (propA > propB) {
                return 1;
            } else {
                return 0;
            }
        });
        return targetArray;
    }

    function processRenditions(renditions, callback) {
        var i,
            iMax = renditions.length,
            hlsRenditions = [],
            mp4Renditions = [];
        // separate renditions by type
        for (i = 0; i < iMax; i += 1) {
            if (renditions[i].video_container === 'M2TS') {
                hlsRenditions.push(renditions[i]);
            } else if (renditions[i].video_container === 'MP4') {
                mp4Renditions.push(renditions[i]);
            }
        }
        // sort renditions by encoding rate
        callback(hlsRenditions, mp4Renditions);
    }

    function createHeadings() {
        var tr,
            th,
            content;
        reportTable.appendChild(reportTableHead);
        reportTable.appendChild(reportTableBody);
        summaryReportTable.appendChild(summaryTableHead);
        summaryReportTable.appendChild(summaryTableBody);
        tr = document.createElement('tr');
        reportTableHead.appendChild(tr);
        th = document.createElement('th');
        content = document.createTextNode('ID');
        th.appendChild(content);
        tr.appendChild(th);
        th = document.createElement('th');
        content = document.createTextNode('Name');
        th.appendChild(content);
        tr.appendChild(th);
        th = document.createElement('th');
        content = document.createTextNode('HLS Renditions (bitrate range KBPS)');
        th.appendChild(content);
        tr.appendChild(th);
        th = document.createElement('th');
        content = document.createTextNode('MP4 Renditions (bitrate range KBPS)');
        th.appendChild(content);
        tr.appendChild(th);
        tr = document.createElement('tr');
        summaryTableHead.appendChild(tr);
        th = document.createElement('th');
        content = document.createTextNode('No HLS or MP4 Renditions');
        th.appendChild(content);
        tr.appendChild(th);
        th = document.createElement('th');
        content = document.createTextNode('HLS but no MP4 Renditions');
        th.appendChild(content);
        tr.appendChild(th);
        th = document.createElement('th');
        content = document.createTextNode('MP4 but no HLS Renditions');
        th.appendChild(content);
        tr.appendChild(th);
        th = document.createElement('th');
        content = document.createTextNode('Both HLS and MP4 Renditions');
        th.appendChild(content);
        tr.appendChild(th);
    }

    function startCSVStrings() {
        csvStr = '"ID","Name","HLS Renditions (bitrate range KBPS)","MP4 Renditions (bitrate range KBPS)"\n';
        summaryCsvStr = '"No HLS or MP4 Renditions","HLS but no MP4 Renditions","MP4 but no HLS Renditions","Both HLS and MP4 Renditions"\n';
    }

    function writeReport() {
        var i,
            iMax,
            video,
            hlsRenditions,
            mp4Renditions,
            hlsLowRate,
            hlsHighRate,
            mp4LowRate,
            mp4HighRate,
            tr,
            th,
            td,
            content;
        // arrays to hold summary groups
        summaryData.noHLSnoMP4 = [];
        summaryData.yesHLSnoMP4 = [];
        summaryData.noHLSyesMP4 = [];
        summaryData.yesHLSyesMP4 = [];

        if (videosArray.length > 0) {
            iMax = videosArray.length;
            for (i = 0; i < iMax; i += 1) {
                video = videosArray[i];
                // prepare the summary data
                if (video.hlsRenditions.length === 0) {
                    if (video.mp4Renditions.length === 0) {
                        summaryData.noHLSnoMP4.push(video.id);
                    } else {
                        summaryData.noHLSyesMP4.push(video.id);
                    }
                } else if (video.mp4Renditions.length === 0) {
                    summaryData.yesHLSnoMP4.push(video.id);
                } else {
                    summaryData.yesHLSyesMP4.push(video.id);
                }

                // generate the video detail row
                hlsLowRate = (video.hlsRenditions.length > 0) ? video.hlsRenditions[0].encoding_rate / 1000 : 0;
                hlsHighRate = (video.hlsRenditions.length > 0) ? video.hlsRenditions[video.hlsRenditions.length - 1].encoding_rate / 1000 : 0;
                mp4LowRate = (video.mp4Renditions.length > 0) ? video.mp4Renditions[0].encoding_rate / 1000 : 0;
                mp4HighRate = (video.mp4Renditions.length > 0) ? video.mp4Renditions[video.mp4Renditions.length - 1].encoding_rate / 1000 : 0;
                tr = document.createElement('tr');
                // add report row
                reportTableBody.appendChild(tr);
                td = document.createElement('td');
                content = document.createTextNode(video.id);
                td.appendChild(content);
                tr.appendChild(td);
                td = document.createElement('td');
                content = document.createTextNode(video.name);
                td.appendChild(content);
                tr.appendChild(td);
                td = document.createElement('td');
                content = document.createTextNode(video.hlsRenditions.length + ' (' + hlsLowRate + '-' + hlsHighRate + ')');
                td.appendChild(content);
                tr.appendChild(td);
                td = document.createElement('td');
                content = document.createTextNode(video.mp4Renditions.length + ' (' + mp4LowRate + '-' + mp4HighRate + ')');
                td.appendChild(content);
                tr.appendChild(td);
                // add csv row
                csvStr += '"' + video.id + '","' + video.name + '","' + video.hlsRenditions.length + ' (' + hlsLowRate + '-' + hlsHighRate + ')","' + video.mp4Renditions.length + ' (' + mp4LowRate + '-' + mp4HighRate + ')"\n';
            }
            tr = document.createElement('tr');
            summaryTableBody.appendChild(tr);
            td = document.createElement('td');
            content = document.createTextNode(summaryData.noHLSnoMP4.length);
            td.appendChild(content);
            tr.appendChild(td);
            td = document.createElement('td');
            content = document.createTextNode(summaryData.yesHLSnoMP4.length);
            td.appendChild(content);
            tr.appendChild(td);
            td = document.createElement('td');
            content = document.createTextNode(summaryData.noHLSyesMP4.length);
            td.appendChild(content);
            tr.appendChild(td);
            td = document.createElement('td');
            content = document.createTextNode(summaryData.yesHLSyesMP4.length);
            td.appendChild(content);
            summaryCsvStr += '"' + summaryData.yesHLSnoMP4.length+ '","' + summaryData.yesHLSnoMP4.length + '","' + summaryData.noHLSyesMP4.length + '","' + summaryData.yesHLSyesMP4.length + '"';
            tr.appendChild(td);
            tr = document.createElement('tr');
            summaryTableBody.appendChild(tr);
            td = document.createElement('td');
            td.setAttribute('style', 'vertical-align:top;');
            content = document.createTextNode(JSON.stringify(summaryData.noHLSnoMP4, null, " "));
            td.appendChild(content);
            tr.appendChild(td);
            td = document.createElement('td');
            td.setAttribute('style', 'vertical-align:top;');
            content = document.createTextNode(JSON.stringify(summaryData.yesHLSnoMP4, null, " "));
            td.appendChild(content);
            tr.appendChild(td);
            td = document.createElement('td');
            td.setAttribute('style', 'vertical-align:top;');
            content = document.createTextNode(JSON.stringify(summaryData.noHLSyesMP4, null, " "));
            td.appendChild(content);
            tr.appendChild(td);
            td = document.createElement('td');
            td.setAttribute('style', 'vertical-align:top;');
            content = document.createTextNode(JSON.stringify(summaryData.yesHLSyesMP4, null, " "));
            td.appendChild(content);
            tr.appendChild(td);
            summaryCsvStr += '"' + JSON.stringify(summaryData.noHLSnoMP4) + '","' + JSON.stringify(summaryData.yesHLSnoMP4) + '","' + JSON.stringify(summaryData.yesHLSnoMP4) + '","' + JSON.stringify(summaryData.yesHLSyesMP4) + '"';
            summaryReport.appendChild(summaryReportTable);
            detailedReport.appendChild(reportTable);
            csvSummaryData.textContent = summaryCsvStr;
            csvData.textContent = csvStr;
            content = document.createTextNode('Finished! See the results or get the CSV data below.');
            pLogFinish.appendChild(content);
            // reportDisplay.innerHTML = summaryReportStr + reportStr;
            makeReport.textContent = 'Get next 100 videos';
            warning.textContent = 'NOTE: if you want to save the CSV data below, do that BEFORE getting the next set of videos!';
            superSet++;
            enableButtons();
        }
    }

    /**
     * sets up the data for the API request
     * @param {String} id the id of the button that was clicked
     */
    function setRequestData(id) {
        var endPoint = '',
            requestData = {};
        // disable buttons to prevent a new request before current one finishes
        disableButtons();
        switch (id) {
            case 'getCount':
                endPoint = accountId + '/counts/videos?sort=created_at';
                requestData.url = baseURL + endPoint;
                requestData.requestType = 'GET';
                apiRequest.textContent = requestData.url;
                getMediaData(requestData, id);
                break;
            case 'getVideos':
                var offset = (superSet * 100) + (limit * callNumber);
                endPoint = accountId + '/videos?sort=created_at&limit=' + limit + '&offset=' + offset;
                requestData.url = baseURL + endPoint;
                requestData.requestType = 'GET';
                apiRequest.textContent = requestData.url;
                getMediaData(requestData, id);
                break;
            case 'getVideoRenditions':
                var i,
                    iMax = videosArray.length;
                callback = function(renditions) {
                    if (renditions.length > 0) {
                        // get the best MP4 rendition
                        processRenditions(renditions, function(hlsRenditions, mp4Renditions) {
                            if (hlsRenditions.length > 0) {
                                sortArray(hlsRenditions, 'encoding_rate');
                            }
                            videosArray[callNumber].hlsRenditions = hlsRenditions;
                            if (mp4Renditions.length > 0) {
                                sortArray(mp4Renditions, 'encoding_rate');
                            }
                            videosArray[callNumber].mp4Renditions = mp4Renditions;
                        });
                    } else {
                        videosArray[callNumber].hlsRenditions = [];
                        videosArray[callNumber].mp4Renditions = [];
                    }
                    videosCompleted++;
                    logText.textContent = totalVideos + ' videos found; videos retrieved: ' + videosCompleted;
                    callNumber++;
                    if (callNumber < iMax) {
                        setRequestData('getVideoRenditions');
                    } else {
                        // write the report
                        writeReport();
                    }
                };
                videosArray[callNumber].hlsRenditions = [];
                videosArray[callNumber].mp4Renditions = [];
                endPoint = accountId + '/videos/' + videosArray[callNumber].id + '/assets/renditions';
                requestData.url = baseURL + endPoint;
                requestData.requestType = 'GET';
                apiRequest.textContent = requestData.url;
                spanVideosCountEl.textContent = callNumber + 1;
                spanVideosTotalEl.textContent = superSetVideos;
                getMediaData(requestData, id, callback);
                break;
        }
    }

    /**
     * send API request to the proxy
     * @param  {Object} requestData options for the request
     * @param  {String} requestID the type of request = id of the button
     * @param  {Function} [callback] callback function
     */
    function getMediaData(options, requestID, callback) {
        var httpRequest = new XMLHttpRequest(),
            responseRaw,
            parsedData,
            requestParams,
            dataString,
            renditions,
            // response handler
            getResponse = function() {
                try {
                    if (httpRequest.readyState === 4) {
                        if (httpRequest.status >= 200 && httpRequest.status < 300) {
                            // check for completion
                            if (requestID === 'getCount') {
                                responseRaw = httpRequest.responseText;
                                parsedData = JSON.parse(responseRaw);
                                // set total videos
                                totalVideos = parsedData.count;
                                superSetVideos = (totalVideos < 100) ? totalVideos : 100;
                                totalCalls = Math.ceil(superSetVideos / limit);
                                logText.textContent = totalVideos + ' videos found; videos retrieved: ' + videosCompleted;
                                spanSetsCountEl.textContent = callNumber + 1;
                                spanSetsTotalEl.textContent = totalCalls;
                                setRequestData('getVideos');
                            } else if (requestID === 'getVideos') {
                                if (httpRequest.responseText === '[]') {
                                    // no video returned
                                    alert('no video returned');
                                }
                                responseRaw = httpRequest.responseText;
                                parsedData = JSON.parse(responseRaw);
                                videosArray = videosArray.concat(parsedData);
                                callNumber++;
                                if (callNumber < totalCalls) {
                                    spanSetsCountEl.textContent = callNumber + 1;
                                    setRequestData('getVideos');
                                } else {
                                    callNumber = 0;
                                    setRequestData('getVideoRenditions');
                                }
                            } else if (requestID === 'getVideoRenditions') {
                                if (httpRequest.responseText === '[]') {
                                    // no video returned
                                    renditions = [];
                                    callback(renditions);
                                } else {
                                    responseRaw = httpRequest.responseText;
                                    renditions = JSON.parse(responseRaw);
                                    // increment offset
                                    callback(renditions);
                                }

                            } else {
                                alert('There was a problem with the request. Request returned ' + httpRequest.status);
                            }
                        }
                    }
                } catch (e) {
                    alert('Caught Exception: ' + e);
                }
            };
        // set up request data
        requestParams = "url=" + encodeURIComponent(options.url) + "&requestType=" + options.requestType;
        // only add client id and secret if both were submitted
        if (isDefined(clientId) && isDefined(clientSecret)) {
            requestParams += '&client_id=' + clientId + '&client_secret=' + clientSecret;
        }

        // set response handler
        httpRequest.onreadystatechange = getResponse;
        // open the request
        httpRequest.open('POST', proxyURL);
        // set headers
        httpRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        // open and send request
        httpRequest.send(requestParams);
    }

    function init() {
        // event listeners
        window.addEventListener('error', function(e) {
            var stack = e.error.stack;
            var message = e.error.toString();
            if (stack) {
                message += '\n' + stack;
            }
            console.log('error', message);
        });
        csvData.addEventListener('click', function() {
            this.select();
        });
        csvSummaryData.addEventListener('click', function() {
            this.select();
        });
        // set up the log elements
        content = document.createTextNode('Getting video set ');
        spanIntro1.appendChild(content);
        content = document.createTextNode('Getting renditions for video ');
        spanIntro2.appendChild(content);
        content = document.createTextNode(' of ');
        spanOf1.appendChild(content);
        content = document.createTextNode(' of ');
        spanOf2.appendChild(content);
        spanSetsCount.setAttribute('id', 'spanSetsCount');
        spanSetsTotal.setAttribute('id', 'spanSetsTotal');
        spanVideosCount.setAttribute('id', 'spanVideosCount');
        spanVideosTotal.setAttribute('id', 'spanVideosTotal');
        pLogGettingVideoSets.appendChild(spanIntro1);
        pLogGettingVideoSets.appendChild(spanSetsCount);
        pLogGettingVideoSets.appendChild(spanOf1);
        pLogGettingVideoSets.appendChild(spanSetsTotal);
        pLogGettingRenditions.appendChild(spanIntro2);
        pLogGettingRenditions.appendChild(spanVideosCount);
        pLogGettingRenditions.appendChild(spanOf2);
        pLogGettingRenditions.appendChild(spanVideosTotal);
        logger.appendChild(pLogGettingVideoSets);
        spanSetsCountEl = document.getElementById('spanSetsCount');
        spanSetsTotalEl = document.getElementById('spanSetsTotal');
        spanSetsCountEl.textContent = callNumber + 1;
        spanSetsTotalEl.textContent = totalCalls;
        logger.appendChild(pLogGettingRenditions);
        spanVideosCountEl = document.getElementById('spanVideosCount');
        spanVideosTotalEl = document.getElementById('spanVideosTotal');
        spanVideosCountEl.textContent = callNumber + 1;
        spanVideosTotalEl.textContent = superSetVideos;
        logger.appendChild(pLogFinish);
        // create table and csv headings
        createHeadings();
        startCSVStrings();

        // button event handlers
        makeReport.addEventListener('click', function() {
            // get the inputs
            clientId = client_id.value;
            clientSecret = client_secret.value;
            // only use entered account id if client id and secret are entered also
            if (isDefined(clientId) && isDefined(clientSecret)) {
                if (isDefined(account_id.value)) {
                    accountId = account_id.value;
                } else {
                    window.alert('To use your own account, you must specify an account id, and client id, and a client secret - since at least one of these is missing, a sample account will be used');
                    clientId = '';
                    clientSecret = '';
                    accountId = '1752604059001';
                }
            } else {
                accountId = '1752604059001';
            }
            // if first set, we need to get the count
            if (superSet === 0) {
                setRequestData('getCount');
            } else {
                if ((totalVideos - videosCompleted) < 100) {
                    superSetVideos = totalVideos - videosCompleted;
                }
                // resets
                videosArray = [];
                summaryData = {};
                totalCalls = superSetVideos / limit;
                callNumber = 0;
                totalCalls = Math.ceil(superSetVideos / limit);
                spanSetsTotalEl.textContent = totalCalls;
                spanSetsCountEl.textContent = callNumber + 1;
                spanVideosTotalEl.textContent = superSetVideos;
                spanVideosCountEl.textContent = 1;
                summaryTableBody.innerHTML = "";
                reportTableBody.innerHTML = "";
                startCSVStrings();
                setRequestData('getVideos');
            }

        });
    }

    init();
})(window, document);
