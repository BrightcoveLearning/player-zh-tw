videojs.plugin('protocolFixer', function() {
    var player = this,
        protocol = window.location.protocol;
    player.on('loadedmetadata', function() {
        var source = player.src(),
            srcWithoutProcol = source.substring(source.indexOf('//'));
        player.src(protocol + srcWithoutProcol);
    });
});
