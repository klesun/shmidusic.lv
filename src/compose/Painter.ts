/// <reference path="../references.ts" />

import * as Ds from "../DataStructures";
import {Control} from "./Control";
import {IShNote} from "../DataStructures";
import {IShmidusicChord} from "../DataStructures";
import {Tls} from "../utils/Tls";
import {S} from "../utils/S";

import jQuery from 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js';
const $: JQueryStatic = jQuery;

export function TactMeasurer(tactSize: number)
{
    let sumFraction = 0;
    let tactNumber = 0;

    let inject = function(chordLength: number)
    {
        sumFraction += chordLength;

        let finishedTact = false;
        while (+sumFraction.toFixed(8) >= tactSize) {
            sumFraction -= tactSize;
            finishedTact = true;
            ++tactNumber;
        }

        return finishedTact;
    };

    return {
        inject: inject,
        hasRest: () => +sumFraction.toFixed(8) > 0,
        tactNumber: () => tactNumber,
        getRest: () => sumFraction
    };
};

export let extractNote = (n: HTMLElement): IShNote => 1 && {
    tune: +$(n).attr('data-tune'),
    channel: +$(n).attr('data-channel'),
    length: +$(n).attr('data-length')
};

let extractChannelTransition = (div: HTMLElement) => 1 && {
    key: +div.getAttribute('data-channel'),
    val: {
        pitchBend: S.opt(div.getAttribute('data-pitch-bend')).map(n => +n).def(null),
        volume: S.opt(div.getAttribute('data-volume')).map(n => +n).def(null),
    }
};

export let SongAccess = {
    extractChord: (c: HTMLSpanElement): IShmidusicChord => 1 && {
        noteList: $(c).children('.noteCanvas').toArray()
            .map(extractNote)
            .sort((n1, n2) => n2.tune - n1.tune),
        startState: Tls.ditu($(c).find('.transitionState.start').toArray().map(extractChannelTransition)),
        finishState: Tls.ditu($(c).find('.transitionState.finish').toArray().map(extractChannelTransition)),
    },
};

type sign_e = 'none' | 'flat' | 'sharp' | 'natural';

/** @return [ivoryIndex, sign] */
export const determinePosition = function(semitone: number, keySignature: number): [number, sign_e]
{
    let ebonySignMap: {[s: number]: Array<number>} = {
        [-7]: [-1, -1, -1, -1, -1, -1, -1],
        [-6]: [-1, -1, -1,  0, -1, -1, -1],
        [-5]: [ 0, -1, -1,  0, -1, -1, -1],
        [-4]: [ 0, -1, -1,  0,  0, -1, -1],
        [-3]: [ 0,  0, -1,  0,  0, -1, -1],
        [-2]: [ 0,  0, -1,  0,  0,  0, -1],
        [-1]: [ 0,  0,  0,  0,  0,  0, -1],
        [+0]: [ 0,  0,  0,  0,  0,  0,  0],
        [+1]: [ 0,  0,  0, +1,  0,  0,  0],
        [+2]: [+1,  0,  0, +1,  0,  0,  0],
        [+3]: [+1,  0,  0, +1, +1,  0,  0],
        [+4]: [+1, +1,  0, +1, +1,  0,  0],
        [+5]: [+1, +1,  0, +1, +1, +1,  0],
        [+6]: [+1, +1, +1, +1, +1, +1,  0],
        [+7]: [+1, +1, +1, +1, +1, +1, +1],
    };

    let octave = Math.floor(semitone / 12);

    let ivory = ebonySignMap[keySignature].findIndex((sign: number, idx: number) => {
        return [0,2,4,5,7,9,11][idx] + sign === semitone % 12;
    });

    if (ivory > -1) {
        // present in base key signature
        return [ivory + octave * 7, 'none'];
    } else {
        let becarIvory = ebonySignMap[keySignature].findIndex((sign, idx) =>
            sign !== 0 && [0,2,4,5,7,9,11][idx] === semitone % 12);

        if (becarIvory > -1) {
            return [becarIvory + octave * 7, 'natural'];
        } else {
            // treating all special note-s as flat - even when it is clearly heard as sharp
            let ivoryIndex = [0,2,4,5,7,9,11].indexOf(semitone % 12 + 1);

            return [ivoryIndex + octave * 7, 'flat'];
        }
    }
};

/** @param R - semibreve note oval vertical radius */
export function CanvasProvider(getNoteRadius: () => number)
{
    let keySignature = 0;

    return {
        extractNote: extractNote,
        getChordWidth: () => getNoteRadius() * 10,
        setKeySignature: (v: number) => keySignature = v,
    };
};

/** TODO: get rid of this class, we i the stuff with clean CSS now */
export function SheetMusicPainter(parentId: string, config: HTMLElement)
{
    let parentEl = document.querySelector('#' + parentId);
    let getNoteRadius = () => +getComputedStyle(parentEl).getPropertyValue('--b-radius').slice(0, -2); // cutting "px" at the end

    let chordListCont = document.createElement('div');
    chordListCont.classList.toggle('chordListCont', true);
    parentEl.appendChild(chordListCont);

    let canvaser = CanvasProvider(getNoteRadius);
    let control = Control(chordListCont, config);

    let interruptDrawing = () => {};
    let currentSong: Ds.IShmidusicStructure = null;

    return {
        setEnabled: (val: boolean) => {},
        getControl: () => control,
        setKeySignature: (v: number) => {
            canvaser.setKeySignature(v);
            let chords = control.getChordList();
            // TODO: optimize!
            control.clear();
            chords.forEach(control.addChord);
        },
    };
};
