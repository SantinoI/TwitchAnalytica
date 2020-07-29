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
    if (GetURLParameter('access_token')) {
        localStorage.token = GetURLParameter('access_token');
    }
}

$.ajax({
    url: 'http://twitc-ecsal-it3rj1p6kk2r-780238624.us-east-1.elb.amazonaws.com/api/v1/users/user',
    headers: {
        'Authorization': localStorage.token,
    },
    method: 'GET',
    success: function(data) {
        console.log(data)
        fillAll(data)
    }
});

$.ajax({
    url: 'http://twitc-ecsal-it3rj1p6kk2r-780238624.us-east-1.elb.amazonaws.com/api/v1/history/history',
    headers: {
        'Authorization': localStorage.token,
    },
    method: 'GET',
    success: function(data) {
        fillTable(data)
    }
});

function fillTable(data) {
    console.log(data);
    data["data"].forEach(function(item) {
        $("#contenuto").append("<tr> <td>" + formatDate(item["timestamp"]) + "</td>  <td>" +
            "<a href=" + item["image_url"] + "> <img class='immagine' src=" + item["image_url"] + " /> </a>" +
            "</td> <td>" + item["classified"]["name"] + "</td>  <td>" + item["title"] + "</td> </tr>");
    })
}


function formatDate(unix_timestamp) {
    var date = new Date(unix_timestamp * 1000);
    return date.toString().split("GMT")[0];
}

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
        selectedGame = $('#category').find(":selected").val();
        $('#message').val('');
        gameTitle = data['data']['gameTitles']
        document.getElementById("message").value = gameTitle[selectedGame]
    });

    $("#resetta").click(function() {
        selectedGame = $('#category').find(":selected").val();
        gameTitle = data['data']['gameTitles']
        document.getElementById("message").value = gameTitle[selectedGame]
    });


    $("#titolo").html(welcome);
    $("#icona").attr("src", img_link);
}