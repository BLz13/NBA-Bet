// Explicit team logo imports - more reliable than glob in production
// Import each SVG as URL using Vite's ?url suffix
// Keys match the NBA API TeamName field (lowercase)

import hawks from './hawks.svg?url';
import celtics from './celtics.svg?url';
import nets from './nets.svg?url';
import hornets from './hornets.svg?url';
import bulls from './bulls.svg?url';
import cavaliers from './cavaliers.svg?url';
import mavericks from './mavericks.svg?url';
import nuggets from './nuggets.svg?url';
import pistons from './pistons.svg?url';
import warriors from './warriors.svg?url';
import rockets from './rockets.svg?url';
import pacers from './pacers.svg?url';
import clippers from './clippers.svg?url';
import lakers from './lakers.svg?url';
import grizzlies from './grizzlies.svg?url';
import heat from './heat.svg?url';
import bucks from './bucks.svg?url';
import timberwolves from './timberwolves.svg?url';
import pelicans from './pelicans.svg?url';
import knicks from './knicks.svg?url';
import thunder from './thunder.svg?url';
import magic from './magic.svg?url';
import sixers from './76ers.svg?url';
import suns from './suns.svg?url';
import blazers from './trail blazers.svg?url';
import kings from './kings.svg?url';
import spurs from './spurs.svg?url';
import raptors from './raptors.svg?url';
import jazz from './jazz.svg?url';
import wizards from './wizards.svg?url';

// Keys match NBA API TeamName field exactly (lowercase)
const teamLogos = {
  'hawks': hawks,
  'celtics': celtics,
  'nets': nets,
  'hornets': hornets,
  'bulls': bulls,
  'cavaliers': cavaliers,
  'mavericks': mavericks,
  'nuggets': nuggets,
  'pistons': pistons,
  'warriors': warriors,
  'rockets': rockets,
  'pacers': pacers,
  'clippers': clippers,
  'lakers': lakers,
  'grizzlies': grizzlies,
  'heat': heat,
  'bucks': bucks,
  'timberwolves': timberwolves,
  'pelicans': pelicans,
  'knicks': knicks,
  'thunder': thunder,
  'magic': magic,
  '76ers': sixers,
  'suns': suns,
  'trail blazers': blazers,
  'kings': kings,
  'spurs': spurs,
  'raptors': raptors,
  'jazz': jazz,
  'wizards': wizards,
};

export default teamLogos;