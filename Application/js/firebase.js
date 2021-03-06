let map = new Map();

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    if (sessionStorage.getItem('userUid') != user.uid) {
      sessionStorage.setItem('userUid', user.uid);
    }

    $("#userID").show();
    $("#logoutBtn").show();
    $("#loginBtn").hide();

    if (window.location.href.indexOf("login") > -1) {
      $("#login_div").hide();
    }

    var user = firebase.auth().currentUser;

    if (user != null) {

      firebase.firestore().collection('users').doc(user.uid).get().then(function(doc) {
          if (doc.exists) {
            $("#userID").html(doc.data().username);

            if (window.location.href.indexOf("user") > -1) {
              //console.log('Username: ' +  doc.data().username);
              $("#userName").html('<strong>Username: </strong>' +  doc.data().username);
              //console.log('Email: ' + user.email);
              $("#userEmail").html('<strong>Email: </strong>' + user.email);
            }
          } else {
              // doc.data() will be undefined in this case
              console.log("No such document!");
          }

      }).catch(function(error) {
          console.log("Error getting document:", error);
      });



    }

  } else {
    // No user is signed in.

    $("#userID").hide();
    $("#logoutBtn").hide();
    $("#loginBtn").show();

    if (window.location.href.indexOf("login") > -1) {
      $("#login_div").show();
    }

    if (window.location.href.indexOf("movie") > -1) {
      $("#addFav").hide();
      $("#removeFav").hide();
    }

    // if (window.location.href.indexOf("movie") > -1) {
    //   document.getElementById("addFav").style.display = "none";
    //   document.getElementById("removeFav").style.display = "inline";
    // }
  }
});

function login(){

  var userEmail = $("#email_field").val();
  var userPass = $("#password_field").val();

  firebase.auth().signInWithEmailAndPassword(userEmail, userPass).then(cred => {
    window.location.href = "./user.html";
  }).catch(function(error) {

    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;

    window.alert("Error : " + errorMessage);

    // ...
  });
}

function loginFromSignup(userEmail, userPass){

  firebase.auth().signInWithEmailAndPassword(userEmail, userPass).then(function(user) {
    window.location.href = "./user.html";
  }).catch(function(error) {

    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;

    window.alert("Error : " + errorMessage);

    // ...
  });
}

function signup() {

  var userEmail = $("#email_field").val();
  var userPass = $("#password_field").val();

  firebase.auth().createUserWithEmailAndPassword(userEmail, userPass).then(cred => {

    var uname = cred.user.email;
    uname = uname.split("@");
    uname = uname[0];

    //console.log(uname);

    // write new doc to collection
    firebase.firestore().collection('users').doc(cred.user.uid).set({
      username: uname,
      useruid: cred.user.uid,
      email: cred.user.email,
      favoriteMovies: []
    })
    .catch(function(error) {
        console.error("Error writing document: ", error);
    });

    loginFromSignup(userEmail, userPass);

  }).catch(function(error) {

    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;

    window.alert("Error : " + errorMessage);

    // ...
  });
}

function logout(){
  firebase.auth().signOut().then(function() {
    window.location.href = "./index.html";
    sessionStorage.removeItem('userUid');
  }, function(error) {
    console.log(error);
  });
}

function passResetFromSignup() {
  var user = firebase.auth().currentUser;
  var userEmail = $("#email_field").val();

  firebase.auth().sendPasswordResetEmail(userEmail).then(function() {
    alert("Password reset email will been sent to your inbox soon.");
  }).catch(function(error) {
    console.log(error);
  });
}

function passResetFromUserPage() {
  var user = firebase.auth().currentUser;
  var userEmail = user.email;

  firebase.auth().sendPasswordResetEmail(userEmail).then(function() {
    alert("Password reset email will been sent to your inbox soon.");
  }).catch(function(error) {
    console.log(error);
  });
}

function getFavoriteMovies() {

  var user = firebase.auth().currentUser;
  var userUid = sessionStorage.getItem('userUid')

  firebase.firestore().collection('users').doc(userUid).onSnapshot(doc => {

    const data = doc.data();

    $('#favMovies').html('');

    for (let i = 0; i < data.favoriteMovies.length; i++) {

      getMovieForFavList(data.favoriteMovies[i], i);
      getPosterForFavList(data.favoriteMovies[i], i);



      $('#favMovies').append(`

        <div id="movie" style="margin-bottom: 0px !important;" class="col-md-3">
          <div class="well text-center">
            <h5 id="favMovie` + i + `" class="movieTitle"></h5>
            <a onclick="movieSelected('` + data.favoriteMovies[i] + `')" class="btn btn-dark" href="#"><img  id="favMoviePoster` + i + `" onerror="this.onerror=null; this.src='images/no_image.png'"></a>
          </div>
        </div>
        `);
    }
  })
}

function addFavorite(movieId) {

  var user = firebase.auth().currentUser;

  if (user) {
    var userUid = user.uid;

    firebase.firestore().collection('users').doc(userUid).update({
        favoriteMovies: firebase.firestore.FieldValue.arrayUnion(movieId)
    });

    //console.log("Added " + movieId + " as favorite");

    $('removeFav').show();

  } else {
    window.location.href = "./login.html";
  }
}

function removeFavorite(movieId) {

  var user = firebase.auth().currentUser;

  if (user) {
    var userUid = user.uid;

    firebase.firestore().collection('users').doc(userUid).update({
        favoriteMovies: firebase.firestore.FieldValue.arrayRemove(movieId)
    });

    //console.log("Removed " + movieId + " as favorite");

  } else {
    window.location.href = "./login.html";
  }
}

function isAFavorite(movieId) {

  $('#removeFav').hide();
  $('#addFav').hide();

  if (sessionStorage.getItem('userUid')) {
    var userUid = sessionStorage.getItem('userUid');

    firebase.firestore().collection('users').doc(userUid).get().then(function(doc) {

      const data = doc.data();

      for (let i = 0; i < data.favoriteMovies.length; i++) {
        if (movieId == data.favoriteMovies[i]) {
          $('#removeFav').show();
          //console.log('fav');



          return true;
        }
      }
      //console.log('notfav');

      $('#addFav').show();

      return false;

    }).catch(function(error) {
        console.log("Error getting document:", error);
    });

  }
}

function getFavoriteMoviesTest() {

  var user = firebase.auth().currentUser;
  var userUid = sessionStorage.getItem('userUid')

  firebase.firestore().collection('users').doc(userUid).onSnapshot(doc => {

    const data = doc.data();

    for (let i = 0; i < data.favoriteMovies.length; i++) {

      let key = 'favoriteMovies'+i;
      sessionStorage.setItem(key, data.favoriteMovies[i]);

    }

  })
}

function getMovieGenre() { // This function gets the movie information via the sessionStorage key that we saved above.

  //TESTER
  //alert("Retreived movieID from session storage: " + movieId);

  var userUid = sessionStorage.getItem('userUid');

  firebase.firestore().collection('users').doc(userUid).onSnapshot(doc => {

    const data = doc.data();

    for (let i = 0; i < data.favoriteMovies.length; i++) {

      let mapFinal = axios.get('http://www.omdbapi.com?i='+data.favoriteMovies[i]+"&"+encodeURI(apiKey)) // This is were we can use the movieID we now have to '.get()' the rest of the movie information to display
        .then(function(response) { // Same thing as above, once we '.get()', then we run the below code
          let movie = response.data; // We can use 'response' as a variable because it is returned from the '.get()' as a JSON value.

          let genres = movie.Genre;

          let arrGenre = genres.split(', ');

          for (let j = 0; j < arrGenre.length; j++) {

            if (map.get(arrGenre[j])) {
              map.set(arrGenre[j], (map.get(arrGenre[j]) + 1));
            } else {
              map.set(arrGenre[j], 1);
            }

          }

          return map;
        })
        .then((map) => {
          map.forEach(getMax);
        })
        .then(() => {
          //console.log("MAX: " + sessionStorage.getItem('maxGenre'));

          maxGenre = sessionStorage.getItem('maxGenre');

          $('#favGenre').html(maxGenre);

          getGenreMovies(maxGenre);

        })
        .catch((err) => { // '.catch()' to catch any errors and console.log() them
          console.log(err);
        });
    }
  })
}

function getGenreMovies(genre) {

  sessionStorage.removeItem('maxGenre');
  sessionStorage.removeItem('max');

  var userUid = sessionStorage.getItem('userUid');

  genre = genre.toLowerCase();

  firebase.firestore().collection('genres').doc(genre).onSnapshot(doc => {

    const data = doc.data();

    $('#recMovies').html('');

    for (let i = 0; i < data.movies.length; i++) {

      getMovieForRecList(data.movies[i], i);
      getPosterForRecList(data.movies[i], i);

      $('#recMovies').append(`

        <div id="movie" style="margin-bottom: 0px !important;" class="col-md-3">
          <div class="well text-center">
            <h5 id="recMovie` + i + `" class="movieTitle"></h5>
            <a onclick="movieSelected('` + data.movies[i] + `')" class="btn btn-dark" href="#"><img  id="recMoviePoster` + i + `" onerror="this.onerror=null; this.src='images/no_image.png'"></a>
          </div>
        </div>
        `);
      }

  })
}

function getMax(value, key, map) {

  //console.log(`${key} = ${value}`);

  if (!sessionStorage.getItem('max')) {
    //console.log('new');
    sessionStorage.setItem('max', value);
    sessionStorage.setItem('maxGenre', key);
  } else if (value > sessionStorage.getItem('max')) {
    //console.log('existing');

    sessionStorage.setItem('max', value);
    sessionStorage.setItem('maxGenre', key);
  }

  //console.log(sessionStorage.getItem('maxGenre'));


}
