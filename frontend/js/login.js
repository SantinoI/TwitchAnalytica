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
    url: 'http://localhost:3000/api/v1/profile',
    headers: {
        'Authorization': localStorage.token,
        'Content-Type': 'application/json'
    },
    method: 'GET',
    dataType: 'json',
    success: function(data) {
        console.log(data)
        fillAll(data)
    }
});

function fillAll(data) {

    let username = data["data"]["login"]
    let img_link = data["data"]["profile_image_url"]

    let welcome = "Welcome " + "<b> " + username + "</b>";

    $("#saveTag").click(function() {
        game = $('#category').find(":selected").text();
        newTag = $('#message').val();
        tmp = data['data']['gameTags']
        arrayTag = data['data']['gameTags']
        for (key in tmp) {
            if (tmp[key]["game"] == game) {
                arrayTag[key] = {
                    'game': game,
                    'tags': newTag
                }
                return;
            }
            arrayTag.push({ 'game': game, 'tags': newTag })
        }


        console.log(arrayTag)
        newData = {
            "gameTags": arrayTag
        }
        console.log("I nuovi tag sono: " + newTag)

        var saveData = $.ajax({
            type: "POST",
            headers: {
                'Authorization': localStorage.token,
            },
            url: 'http://localhost:3000/api/v1/profile',
            data: newData,
            dataType: "json",
            success: function(resultData) {
                alert("Save Complete");
                location.reload();
            }
        });
        saveData.error(function() { alert("Something went wrong"); });
    });


    $('#category').change(function() {
        selectedGame = $('#category').find(":selected").text();
        $('#message').val('');
        gameTags = data['data']['gameTags']
        for (key in gameTags) {
            console.log(gameTags[key]['game'])
            if (gameTags[key]['game'] == selectedGame) {
                tag = gameTags[key]['tags']
                console.log(tag)
                $('#message').val(tag);
            }
        }
    });



    $("#resetta").click(function() {});

    $("#titolo").html(welcome);
    $("#icona").attr("src", img_link);
}