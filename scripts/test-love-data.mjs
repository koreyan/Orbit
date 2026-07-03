import { createChart } from "@orrery/core/ziwei";

// 1998년 1월 16일 오전 12시 38분 남자
const generatedChart = createChart(1998, 1, 16, 0, 38, true);
const palaces = generatedChart.palaces;

const collectStarNamesFromPalace = (palace) => {
  if (!palace) return [];
  return [palace.majorStars ?? [], palace.luckyStars ?? [], palace.unluckyStars ?? []]
    .flat()
    .flatMap((star) => star.sihua ? [star.name, star.sihua] : [star.name]);
};

const uniqueTerms = (terms) => (
  Array.from(new Set(terms.map((term) => term.trim()).filter(Boolean)))
);

const buildLoveDictionaryTerms = (extractedStars) => {
  const palaces = Object.values(extractedStars);
  const starTerms = uniqueTerms(palaces.flatMap(collectStarNamesFromPalace));
  const palaceTerms = uniqueTerms(
    palaces.flatMap((palace) => {
      const starNames = collectStarNamesFromPalace(palace);
      return [
        palace.name,
        ...starNames.map((starName) => `${palace.name} ${starName}`),
      ];
    })
  );
  const formationTerms = uniqueTerms([
    ...starTerms,
    ...palaceTerms,
    "삼방사정",
    "도화",
    "화기",
    "살성",
    "길성",
    "홍란",
    "천희",
  ]);

  return { starTerms, palaceTerms, formationTerms };
};

const terms = buildLoveDictionaryTerms(palaces);
console.log("starTerms:", terms.starTerms);
console.log("palaceTerms:", terms.palaceTerms);
console.log("formationTerms:", terms.formationTerms);

