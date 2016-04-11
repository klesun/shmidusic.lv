
/// <reference path="../DataStructures.ts" />
/// <reference path="../Tools.ts" />
/// <reference path="../../../libs/definitelytyped/lib.es6.d.ts" />
/// <reference path="../../../libs/definitelytyped/webmidi.d.ts" />


import MIDIMessageEvent = WebMidi.MIDIMessageEvent;
var Ns: any = Ns || {};
Ns.Compose = Ns.Compose || {};

interface PainterT {
    draw: { (song: IShmidusicStructure): void },
    handleNoteOn: { (note: IShNote, chordIndex: number): { (): void } },
    setEnabled: { (val: boolean): void },
}

// this function bounds some events: midi/mouse/keyboard to the
// SheetMusicPainter in other words, it allows to write the sheet music

Ns.Compose.Handler = function(contId: string): void
{
    var painter: PainterT = Ns.SheetMusicPainter(contId);
    painter.setEnabled(true);

    var chords: IShmidusicChord[] = [];

    /** @debug */
    painter.draw({staffList: [{
        staffConfig: {
            tempo: 120,
            keySignature: 0,
            numerator: 8,
            channelList: []
        },
        chordList: [
            {noteList: [
                { length: 0.5, channel: 0, tune: 69 },
                { length: 0.5, channel: 0, tune: 65 },
                { length: 0.5, channel: 0, tune: 62 },
            ]},
            {noteList: [
                { length: 0.5, channel: 0, tune: 73 },
                { length: 0.5, channel: 0, tune: 66 },
                { length: 0.5, channel: 0, tune: 64 },
            ]},
        ]
    }]});

    var handleNoteOn = function(semitone: number)
    {
        chords.push({noteList: [{
            tune: semitone,
            channel: 0,
            length: 0.25
        }]});

        painter.draw({staffList: [{
            staffConfig: {
                tempo: 120,
                keySignature: 0,
                numerator: 8,
                channelList: []
            },
            chordList: chords
        }]});
    };

    var handleMidiEvent = function (message: MIDIMessageEvent) {
        var eventType = // bit mask: "100X YYYY" -> x => noteOn: yes/no | YYYY => channelNumber
            (message.data[0] === 144) ? 'noteOn' :
                (message.data[0] === 128) ? 'noteOff' :
                'unknown' + message.data[0];

        var tune = message.data[1];
        var velocity = message.data[2];
        console.log('midi event tune: ' + tune + '; velocity: ' + velocity + '; type: ' + eventType, message);

        if (eventType === 'noteOn' && velocity > 0) {
            handleNoteOn(tune);
        }
    };

    var hangMidiHandlers = function()
    {
        var gotMidi = function (midiInfo: WebMidi.MIDIAccess)
        {
            var compose = Util.Compose($('#composeDiv')[0]);

            console.log("Midi Access Success!", midiInfo);

            var inputs = midiInfo.inputs.values();
            for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
                input.value.onmidimessage = handleMidiEvent;
            }
        };

        // request MIDI access
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess()
                .then(gotMidi, (e: any) => console.log("Failed To Access Midi, Even Though Your Browser Has The Method...", e));
        } else {
            console.log("No MIDI support in your browser.");
        }

    };

    hangMidiHandlers();
};