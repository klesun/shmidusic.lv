
// requires Util.TableGenerator.js !
// requires Util.PianoLayoutPanel.js !
// requires Util.Playback.js !

var MainPage = function($pianoCanvas, $playbackControlCont) {

    var performExternal = function(scriptName, callback) {

        xmlhttp = new XMLHttpRequest();
        var isDone = () => xmlhttp.readyState == XMLHttpRequest.DONE;
        var isOk = () => xmlhttp.status == 200;
        var getResponse = () => {
            return JSON.parse(xmlhttp.responseText);
        };
        var getErrorMessage = () => 'Failed to get ajax with script ' + script + ' status: ' + xmlhttp.status;

        xmlhttp.onreadystatechange = () => isDone()
            ? (isOk() ? callback(getResponse()) : alert(getErrorMessage()))
            : -100;

        xmlhttp.open("GET", "/htbin/" + scriptName, true);
        xmlhttp.send();
    };

    var pianoLayoutPanel = Util.PianoLayoutPanel($pianoCanvas);
    var playback = Util.Playback(pianoLayoutPanel, $playbackControlCont);

    var playDemo = function () {
        var mineList = Globals.shmidusicList;
        var index = Math.floor(Math.random() * mineList.length);
        console.log('Playing: ' + mineList[index].fileName);
        playback.play(mineList[index].sheetMusic);
    };

    var playRandom = () => alert("Please, wait till midi names load from ajax!");

    var init = function () {

        var initIchigosMidiList = function () {

            var playButtonFormatter = function (cell, row) {
                var link = 'get_standard_midi_file.py?file_name=' + row.rawFileName;
                return $('<input type="button" value="Play!"/>')
                    .click(() => performExternal(link, answer => playback.playStandardMidiFile(answer, row.rawFileName)));
            };

			var callback = function (rowList) {
				var colModel = [
					{'name': 'fileName', 'caption': 'File Name'},
					//{'name': 'length', 'caption': 'Length'},
					{'name': 'score', 'caption': '*'},
					{'name': 'playButton', 'caption': 'Play', formatter: playButtonFormatter}
				];

				var caption = 'From <a href="http://ichigos.com">ichigos.com</a>';
				
				var shuffle = function(o) {
					for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
					return o;
				}
				
				shuffle(rowList);

				var table = Util.TableGenerator().generateTable(colModel, rowList, caption, 10, 50);
				$('.random-midi-list-cont').append(table); // defined in main_page.html

                playRandom = function () {

                    var index = Math.floor(Math.random() * rowList.length);
                    console.log('Playing: ' + rowList[index].fileName);

                    var link = 'get_standard_midi_file.py?file_name=' + rowList[index].rawFileName;
                    performExternal(link, answer => playback.playStandardMidiFile(answer, rowList[index].fileName));
                };
			};
		
			performExternal('get_ichigos_midi_names.py', callback)
        };

        var initMyMusicList = function () {

            var playButtonFormatter = function (cell, row) {
                return $('<input type="button" value="Play!"/>')
                        .click(() => playback.play(row['sheetMusic']));
            };

            rowList = Globals.shmidusicList;
            rowList.sort((a,b) => a.fileName.localeCompare(b.fileName)); // sorting lexicographically

            var colModel = [
                {'name': 'fileName', 'caption': 'File Name', formatter: s => s.split('_').join(' ')},
                {'name': 'playButton', 'caption': 'Play', formatter: playButtonFormatter}
            ];

            var caption = 'My music';

            var table = Util.TableGenerator().generateTable(colModel, rowList, caption);
            $('.something-left-cont').append(table); // defined in main_page.html
        };

        initIchigosMidiList();
        initMyMusicList();
    };

    return {
        init: init, // TODO: split to initShmidusicList() and initIchigosMidiList()
        playDemo: playDemo,
        playRandom: () => playRandom(),
        changeSynth: playback.changeSynth,
    };
};
