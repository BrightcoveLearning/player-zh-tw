videojs.plugin('registerToPlay', function(options) {
    var myPlayer = this;

    /**
     * hides the overlay, unhides the controls, and plays the video
     * this function is called from the registration form in the iframe
     * and that is why it is defined in the global scope
     */
    playVideo = function () {
        // hide the overlay, reveal the controls, play
        myPlayer.addClass('hide-overlay'); myPlayer.removeClass('hide-controls');
        myPlayer.play();
    };

    // hide the overlay until needed
    myPlayer.addClass('hide-overlay');
    myPlayer.on('timeupdate', function(evt) {
        // use my player.currentTime() to get the current position
        // you can't be sure the event will fire at 5 seconds, so check for
        // when the currentTime exceeds 3
        if (myPlayer.currentTime() > 3) {
            myPlayer.pause();
            // we only want to do this once, so unload the listener
            myPlayer.off('timeupdate'); myPlayer.removeClass('hide-overlay'); myPlayer.addClass('hide-controls');
        }
    });
});
