let instructor = null;

const startup = function (session) {
    instructor = session.Instructor;

    document.getElementById('greeting').innerText = `Welcome ${session.UCID}`;
};
