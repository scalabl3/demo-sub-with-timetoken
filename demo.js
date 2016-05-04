var params = {
    state: {
        origin: "pubsub.pubnub.com",
        tls: false,
        subkey: 'sub-c-5f1b7c8e-fbee-11e3-aa40-02ee2ddab7fe',
        channels: ['pubnub-sensor-network'],
        authkey: null,
        drift: 0
    }
};


/* Normal Subscribe
*
    var p = PUBNUB.init({
        subscribe_key: params.state.subkey
    });

    p.subscribe({
        channel : 'pubnub-sensor-network',
        message : function(msg) {
            console.log(msg)
        }
    });
*
*/

function make_url(timetoken) {

    timetoken = (timetoken ? timetoken : 0);

    var querystring = [];

    var url = (params.state.tls ? "https:" : "http:");

    url += "//" + params.state.origin;
    url += "/subscribe";
    url += "/" + params.state.subkey;
    url += "/" + params.state.channels.join('%2c');
    url += "/0/" + timetoken;

    if (params.state.authkey) {
        querystring.push(["auth", params.state.authkey]);
    }

    //querystring.push(["t", timetoken]);

    if (querystring.length > 0) {
        url += "?";
        for (i in querystring) {
            var param = querystring[i];
            if (i > 0) {
                url += "&";
            }
            url += param[0] + "=" + param[1];
        }
    }

    return url;
}

function display_messages(m) {
    console.log([m[0]]);

    var txt = "";

    $("#sub-cnt").text(m[0].length);

    m[0].forEach(function(msg){
        txt += JSON.stringify(msg, null, " ") + "\n\n";
    });

    $("#messages").html('<pre><code class="unformatted json">' + txt + '</code></pre>');

    highlight_all();
}

function subscribe_rest(seconds_ago) {

    var now = Date.now();
    var s = seconds_ago + Math.floor(params.state.drift / 1000);
    var tt = epoch_to_pn(now, s);

    //console.log(now, seconds_ago, Math.floor(params.state.drift / 1000), s, tt);

    $("#sub-ep").text(now);
    $("#sub-tt").text(tt);


    var url = make_url(tt);
    console.log(url);

    $.ajax({
        cache: false,
        success: function (data, status) {
            //console.log(status);
            display_messages(data);
        },
        contentType: "text/plain",
        dataType: "json",
        method: "GET",
        url: url
    });
}

function epoch_to_pn(epoch, subtract_seconds) {
    subtract_seconds = (subtract_seconds ? subtract_seconds : 0);
    return (epoch - (subtract_seconds * 1000)) * 10000;
}

function pn_to_epoch(pn) {
    pn = parseInt(pn);
    return (pn / 10000);
}

function get_time(cb) {
    $.getJSON("http://pubsub.pubnub.com/time/0", null, function(d){

        var pn = d[0];
        $("#pn-t").text(pn);

        var now = Date.now();
        $("#now").text(now);
        $("#pn-tt").text(epoch_to_pn(now));

        params.state.drift = Math.floor(now - pn_to_epoch(pn));

        $("#tt-delta").text( (params.state.drift > 0 ? "+" : "-" ) + params.state.drift + " ms");

        cb();
    });
}

$(function() {
    get_time(function(){

    });

    $("#buttons button").each(function(){
        var b = $(this);
        b.click(function(){
            var seconds = parseInt(b.attr("data-time"));
            get_time(function(){
                subscribe_rest(seconds);
            });
        });
    });
});
