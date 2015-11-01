module App {
    'use strict';

    type TopFrame = { top: number; durationMs: number };

    export class SlideFromAbove {
        public enter = (element: JQuery, doneFn: Function) => {

            var currentFixedTop = this.getTopPosInViewPort(element);
            var currentHeight = parseFloat(element.css('height'));
            element.css('top', `-${currentHeight + currentFixedTop + 1}px`);
            element.css('visibility', 'visible');

            var topFrames: TopFrame[] = [
                { top: currentHeight * .10, durationMs: 500 },
                { top: -currentHeight * .05, durationMs: 200 },
                { top: currentHeight * .05, durationMs: 200 },
                { top: -currentHeight * .025, durationMs: 200 },
                { top: 0, durationMs: 50 }
            ];

            this.slide(element, topFrames, 0, doneFn);
        }

        private slide = (element: JQuery, frames: TopFrame[], frameN: number, doneFn: Function) => {
            if (frameN === frames.length) {
                doneFn();
            } else {
                element.animate(
                    { 'top': `${frames[frameN].top}px` },
                    frames[frameN].durationMs,
                    () => {
                        this.slide(element, frames, frameN + 1, doneFn);
                    });
            }
        }

        private getTopPosInViewPort(element: JQuery) {
            return element.offset().top - $(window).scrollTop();
        }
    }

    var factory = () => new SlideFromAbove();

    angular.module('App').animation('.slide-from-above', factory);
}


