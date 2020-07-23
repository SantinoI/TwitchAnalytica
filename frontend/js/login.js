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




    $('#category').change(function() {
        selectedGame = $('#category').find(":selected").text();
        console.log(selectedGame)
    });


    $("#titolo").html(welcome);
    $("#icona").attr("src", img_link);
}