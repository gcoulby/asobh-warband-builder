export interface Credit {
  /** What the credit is for. */
  role: string
  name: string
  url?: string
}

/** Who made the game and who made this builder. */
export const gameCredit = {
  title: 'Advanced Song of Blades and Heroes',
  holder: 'Andrea Sfiligoi',
  url: 'http://www.ganeshagames.net/',
}

export const builderCredit: Credit = { role: 'Warband Builder by', name: 'Graham Coulby' }

/** Source of the SBH Revised trait names, costs and checks. */
export const dataCredit: Credit = {
  role: 'SBH Revised trait data from the Online Warband Calculator by',
  name: 'Christoph Zager',
  url: 'https://github.com/chzager/sbhowc',
}
