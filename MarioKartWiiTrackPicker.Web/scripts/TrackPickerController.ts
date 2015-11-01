module App {
    'use strict';

    //todo:
    //-rejection
    // -pan
    // -swipe
    // -button (X)
    // -"swipe to veto"
    //   Hide on desktop
    //
    //
    //-improve slide-in animation
    // preload images
    // -make it really from the top
    //
    //-cup titles
    //
    //offline library / why updates unreliable?
    //
    //appify button
    //
    //gulp best pratices

    export class TrackPickerController {
        private defaultRaceCount = 4;
        private raceAppearIntervalMs = 250;

        constructor(
            private $scope,
            private $interval: angular.IIntervalService,
            private _: _.LoDashStatic,
            private racePicker: ITrackPicker) {

            this.raceCount = this.defaultRaceCount;
            this.races = [];
            this.isPicking = false;
        }

        public raceCount: number;
        public races: IRace[];
        public isPicking: boolean;

        public pickTracks() {
            this.isPicking = true;
            this.races = [];

            var randomRaces = this.racePicker.getRandomRaces(this.raceCount);
            this.races.push(randomRaces[0]);

            // ReSharper disable once CoercedEqualsUsing
            // justification: raceCount is set from text input
            if (this.raceCount == 1) {
                this.finishPicking();
                return;
            }
            this.$interval(() => { }, this.raceAppearIntervalMs, this.raceCount - 1)
                .then(
                    this.finishPicking,
                    () => { },
                    (tick: number) => {
                        // tick
                        this.races.push(randomRaces[tick + 1]);
                    });
        }


        private finishPicking = () => {
            this.isPicking = false;
        }
    }

    TrackPickerController.$inject = ['$scope', '$interval', '_', 'trackPicker'];
    angular.module('App').controller('TrackPickerController', TrackPickerController);
}


