module App {
    'use strict';

    export class TrackPicker implements ITrackPicker {

        constructor(private _: _.LoDashStatic) {
            this.remainingRaces = [];
        }

        private cupsInGame = 8;
        private tracksPerCup = 4;

        private remainingRaces: IRace[];

        public getRandomRaces = (raceCount: number): IRace[] => {
            this.resetRemainingRaces();
            return this._.map(this._.range(raceCount), this.pickRandomRace);
        }

        public checkCanVeto = (): boolean => {
            return this.remainingRaces.length > 0;
        }

        public veto = (race: IRace) => {
            if (!this.checkCanVeto()) return;
            var nextChoice = this.pickRandomRace();
            race.cup = nextChoice.cup;
            race.track = nextChoice.track;
            race.tracksInfo = nextChoice.tracksInfo;
        }

        private resetRemainingRaces = () => {
            var cupNumbers = this._.range(1, this.cupsInGame + 1);
            var trackNumbers = this._.range(1, this.tracksPerCup + 1);
            var allRacesNested = this._.map(cupNumbers, cupN => {
                return this._.map(trackNumbers, trackN => {
                    return <IRace>{
                        cup: cupN,
                        track: trackN,
                        tracksInfo: this.getTrackInfo(cupN, trackN)
                    };
                });
            });
            this.remainingRaces = this._.flatten(allRacesNested);
        }

        private getTrackInfo = (cup: number, track: number): ITrackInfo[] => {
            return this._.times(4, (i) => {
                return {
                    trackFileNumber: ((cup - 1) * 4) + i,
                    isSelected: (i + 1) === track
                }
            });
        }

        private pickRandomRace = () => {
            var randomIndex = Math.floor(Math.random() * this.remainingRaces.length);
            var pickedRace = this.remainingRaces[randomIndex];
            this._.remove(this.remainingRaces, pickedRace);
            return pickedRace;
        }
    }


    var factory =
        (_: _.LoDashStatic) => new TrackPicker(_);
    factory.$inject = ['_'];

    angular.module('App').service('trackPicker', factory);
}