let instructor = null;

let startup = function(session){
  instructor = session.Instructor;

  document.getElementById('greeting').innerText = `Welcome ${session.UCID}`;

}
