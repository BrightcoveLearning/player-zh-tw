videojs("renditionSelect").ready(function() {
    var myPlayer = this,
        videoID,
        totalRenditions,
        mp4Ara = [],
        highestQuality,
        nowPlaying = document.getElementById('nowPlaying'),
        allRenditions = document.getElementById('allRenditions');

    myPlayer.one('loadstart', function(evt) {
        videoName = myPlayer.mediainfo['name'];
        rendtionsAra = myPlayer.mediainfo.sources;
        allRenditions.textContent = JSON.stringify(rendtionsAra, null, '  ');
        totalRenditions = rendtionsAra.length;
        for (var i = 0; i < totalRenditions; i++) {
            if (rendtionsAra[i].container === "MP4" && rendtionsAra[i].hasOwnProperty('src')) {
                mp4Ara.push(rendtionsAra[i]);
            }
        }
        mp4Ara.sort(function(a, b) {
            return b.size - a.size;
        });
        highestQuality = mp4Ara[0].src;
        myPlayer.src(highestQuality);
        nowPlaying.textContent = myPlayer.currentSrc();
    });
});
