declare module App {
    interface ITrackPicker {

        getRandomRaces(raceCount: number): IRace[];

        /**
         * Returns true if there are any tracks left
         * to change to
         * @returns {} 
         */
        checkCanVeto(): boolean;

        /**
         * Picks a new random race, and sets the properties of the given race
         * to those of the new race, or does nothing if no further races
         * are available
         * @param race 
         * @returns {} 
         */
        veto(race: IRace): void;
    }
}