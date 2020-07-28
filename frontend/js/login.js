$(document).ready(function() {
    $(window).unload(saveSettings);
    loadSettings();
});

function loadSettings() {
    console.log("ciao")
        //window.alert(localStorage.token);
}

function GetURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}

function saveSettings() {
    localStorage.token = GetURLParameter('access_token');
}

$.ajax({
    url: 'http://twitc-ecsal-it3rj1p6kk2r-780238624.us-east-1.elb.amazonaws.com/api/v1/users/user',
    //url: 'http://13d4cb8f2530.ngrok.io/api/v1/users/user',
    headers: {
        'Authorization': localStorage.token,
    },
    method: 'GET',
    success: function(data) {
        console.log(data)
        fillAll(data)
    }
});
/*
$.ajax({
    url: 'http://twitc-ecsal-it3rj1p6kk2r-780238624.us-east-1.elb.amazonaws.com/api/v1/history/history',
    headers: {
        'Authorization': localStorage.token,
    },
    method: 'GET',
    success: function(data) {
        console.log(data)
        fillAll(data)
    }
});

*/

function fillAll(data) {

    let username = data["data"]["login"]
    let img_link = data["data"]["profile_image_url"]
    var title_list = data["data"]["gameTitles"]

    let welcome = "Welcome " + "<b> " + username + "</b>";

    $("#saveTitle").click(function() {
        game = $('#category').find(":selected").val();
        newTitle = $('#message').val();
        if (!title_list) title_list = {}
        title_list[game] = newTitle
        console.log(title_list)
        data['data']['gameTitles'] = title_list
        $.ajax({
            type: "POST",
            headers: {
                'Authorization': localStorage.token,
            },
            url: 'http://twitc-ecsal-it3rj1p6kk2r-780238624.us-east-1.elb.amazonaws.com/api/v1/users/user',
            //url: 'http://13d4cb8f2530.ngrok.io/api/v1/users/user',
            data: JSON.stringify({ "gameTitles": title_list }),
            dataType: "json",
            contentType: "application/json",
            success: function(resultData) {
                alert("Save Complete");
                location.reload();
            }
        }).error(function() { alert("Something went wrong"); });
    });


    $('#category').change(function() {
        selectedGame = $('#category').find(":selected").text();
        $('#message').val('');
        gameTitle = data['data']['gameTitles']
        for (key in gameTitle) {
            console.log(gameTitle[key]['game'])
            if (gameTitle[key]['game'] == selectedGame) {
                title = gameTitle[key]['title']
                $('#message').val(title);
            }
        }
    });



    $("#resetta").click(function() {});

    $("#titolo").html(welcome);
    $("#icona").attr("src", img_link);
}