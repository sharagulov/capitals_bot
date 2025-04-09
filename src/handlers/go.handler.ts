// import { Context } from 'telegraf';
// import { getCountryPool } from '@/services/country.service';
// import { setSession } from '@/redis/session';

// export async function startHandler(ctx: Context) {
//   const pool = getCountryPool();
//   const currentIndex = 0;

//   await setSession(ctx.from!.id, {
//     pool,
//     currentIndex,
//     correct: [],
//     incorrect: []
//   });

//   const currentCountry = pool[currentIndex].en;
//   await ctx.reply(`Переведи слово: *${currentWord}*`, { parse_mode: 'Markdown' });
// }
