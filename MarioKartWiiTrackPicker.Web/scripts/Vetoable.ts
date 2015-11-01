module App {
    'use strict';

    export class Vetoable implements ng.IDirective {

        constructor(private $interval: ng.IIntervalService, private trackPicker: ITrackPicker) { }

        public restrict = 'A';

        public scope = {
            vetoable: '='
        };

        private widthAtStartOfPan: number;
        private heightAtStartOfPan: number;
        private borderAtStartOfPan: string;
        private fakeElem: JQuery;
        private replacerElem: JQuery;
        private panStarted: boolean;
        private autoPanStarted: boolean;
        private isoScope: IVetoableScope;

        public link = ($scope: IVetoableScope, element: JQuery) => {
            this.replacerElem = $($('script#replacerTemplate').html());
            this.panStarted = false;
            this.autoPanStarted = false;
            this.isoScope = $scope;

            // force no scrolling on this element to prevent scrolling
            // when mouse dragging to pan
            element.on('scroll', () => {
                element.scrollLeft(0);
            });

            // add gesture events after a delay, to ensure
            // they are registered on the dynamically-added
            // elements
            this.$interval(() => {
                this.addGestures($scope, element, $scope.vetoable);
            }, 2000, 1);

            element.find('.race-veto').click(() => {
                this.vetoButtonClick(element, $scope.vetoable);
            });

            $scope.$watch(this.trackPicker.checkCanVeto, () => {
                if (!this.trackPicker.checkCanVeto()) {
                    element.find('.race-veto').addClass('disabled');
                }
            });
        }

        private vetoButtonClick = (element: JQuery, race: IRace) => {
            if (this.panStarted || this.autoPanStarted || !this.trackPicker.checkCanVeto()) {
                return;
            }
            this.panStart(element);
            this.panOut(element, this.widthAtStartOfPan, race);
        }

        private addGestures = ($scope: ng.IScope, element: JQuery, race: IRace) => {
            var hammertime = new Hammer(element[0]);
            $scope.$on('$destroy', () => {
                hammertime.destroy();
            });

            hammertime.on('panstart', () => {
                this.panStart(element);
            });
            hammertime.on('panleft', (event) => {
                this.panRace(event);
            });
            hammertime.on('panright', (event) => {
                this.panRace(event);
            });
            hammertime.on('swiperight', (event) => {
                this.swipe(event, element, race);
            });
            hammertime.on('pancancel', (event) => {
                this.panStop(event, element, race);
            });
            hammertime.on('panend', (event) => {
                this.panStop(event, element, race);
            });
        }

        private panStart = (element: JQuery) => {
            if (this.panStarted || this.autoPanStarted) return;
            this.panStarted = true;
            this.widthAtStartOfPan = parseFloat(element.css('width'));
            this.heightAtStartOfPan = parseFloat(element.css('height'));
            this.borderAtStartOfPan = element.css('border');
            this.fakeElem = element.clone()
                .css('top', '0')
                .css('position', 'absolute')
                .css('visibility', 'visible')
                .css('left', '0')
                .css('width', `${this.widthAtStartOfPan}px`)
                .css('height', `${this.heightAtStartOfPan}px`);
            this.updateReplacer(0);
            element.css('visibility', 'hidden')
                .css('width', `${this.widthAtStartOfPan}px`)
                .css('height', `${this.heightAtStartOfPan}px`)
                .css('overflow', 'hidden')
                .css('border', '0');
            element.append(this.fakeElem);
            if (this.trackPicker.checkCanVeto()) {
                element.append(this.replacerElem);
            }
        }

        private panRace = (event: HammerInput) => {
            if (this.autoPanStarted) return;
            if (!this.panStarted) return;
            var panOffset = event.deltaX > 0 ?
                event.deltaX > this.widthAtStartOfPan ?
                    this.widthAtStartOfPan : event.deltaX
                : 0;
            this.fakeElem.css('left', `${panOffset}px`);
            this.updateReplacer(panOffset);
        }

        private updateReplacer = (deltaX: number) => {
            var percentOfFullSize = 20 + ((80 / this.widthAtStartOfPan) * deltaX);
            var width = (this.widthAtStartOfPan / 100) * percentOfFullSize;
            var height = (this.heightAtStartOfPan / 100) * percentOfFullSize;
            var fifteenPercentOfWidth = this.widthAtStartOfPan / 100 * 15;
            var left = fifteenPercentOfWidth - ((fifteenPercentOfWidth / 100) * percentOfFullSize);
            var top = (this.heightAtStartOfPan - height) / 2;
            var opacity = (1 / 100) * percentOfFullSize;
            this.replacerElem
                .css('width', `${width}px`)
                .css('height', `${height}px`)
                .css('left', `${left}px`)
                .css('top', `${top}px`)
                .css('opacity', `${opacity}`);
        }

        private panStop = (event: HammerInput, element: JQuery, race: IRace) => {
            this.panStarted = false;
            if (this.autoPanStarted) return;
            var panDifference = this.widthAtStartOfPan - event.deltaX;
            var leftToPan = panDifference > this.widthAtStartOfPan ?
                this.widthAtStartOfPan :
                panDifference < 0 ? 0 : panDifference;
            var proportionOfPanelWhichNeedsToBeLeftToKeepTheRace = 0.6;
            if (leftToPan > this.widthAtStartOfPan * proportionOfPanelWhichNeedsToBeLeftToKeepTheRace) {
                this.resetPan(element);
            } else {
                this.panOut(element, leftToPan, race);
            }
        }

        private swipe = (event: HammerInput, element: JQuery, race: IRace) => {
            if (this.autoPanStarted) return;
            var panDifference = this.widthAtStartOfPan - event.deltaX;
            var leftToPan = panDifference > this.widthAtStartOfPan ?
                this.widthAtStartOfPan :
                panDifference < 0 ? 0 : panDifference;
            this.panOut(element, leftToPan, race);
        }

        private panOut = (element: JQuery, leftToPan: number, race: IRace) => {
            if (this.autoPanStarted) return;
            this.autoPanStarted = true;

            if (!this.trackPicker.checkCanVeto()) {
                this.resetPan(element);
                return;
            }

            if (leftToPan <= 0) {
                // no need to animate out - we're already out.
                this.vetoRace(element, race);
                return;
            }
            var panOutDurationMs = 300;
            this.fakeElem.animate({ left: `${this.widthAtStartOfPan}px` }, panOutDurationMs, 'linear');
            this.replacerElem.animate(
                {
                    top: '0',
                    left: '0',
                    width: `${this.widthAtStartOfPan}px`,
                    height: `${this.heightAtStartOfPan}px`,
                    opacity: '1'
                },
                panOutDurationMs,
                'linear',
                () => {
                    // animation complete
                    this.vetoRace(element, race);
                });
        }

        private vetoRace = (element: JQuery, race: IRace) => {
            this.trackPicker.veto(race);
            this.resetPan(element);
            // $apply because the race may not be visible at the moment 
            // when the change occurs, and therefore wont update
            this.isoScope.$apply();
        }

        private resetPan = (element: JQuery) => {
            this.replacerElem.remove();
            this.fakeElem.remove();
            element
                .css('overflow', '')
                .css('visibility', '')
                .css('left', '')
                .css('width', '')
                .css('height', '')
                .css('border', this.borderAtStartOfPan);
            this.panStarted = false;
            this.autoPanStarted = false;
        }
    }

    interface IVetoableScope extends angular.IScope {
        vetoable: IRace
    }

    var factory: ng.IDirectiveFactory =
        ($interval: ng.IIntervalService, trackPicker: ITrackPicker) =>
            new Vetoable($interval, trackPicker);

    factory.$inject = ['$interval', 'trackPicker'];

    angular.module('App').directive('vetoable', factory);
}