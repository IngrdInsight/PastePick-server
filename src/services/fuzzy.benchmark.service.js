import {fuzzyFindSimilarIngredient, resetFuzzyCache} from "./ai/embedding.service.js";

const ingredientTestCases = [
    // limonene
    { noisy: "limonine", correct: "limonene" },
    { noisy: "limoneen", correct: "limonene" },
    { noisy: "limonnene", correct: "limonene" },
    { noisy: "limoneme", correct: "limonene" },
    { noisy: "lomonene", correct: "limonene" },
    { noisy: "limonnne", correct: "limonene" },
    { noisy: "limoenene", correct: "limonene" },
    { noisy: "lomonine", correct: "limonene" },
    { noisy: "limonee", correct: "limonene" },
    { noisy: "limonsne", correct: "limonene" },

    // aqua
    { noisy: "aqa", correct: "aqua" },
    { noisy: "aqua ", correct: "aqua" },
    { noisy: "aqua.", correct: "aqua" },
    { noisy: "auqa", correct: "aqua" },
    { noisy: "aqya", correct: "aqua" },
    { noisy: "aqwu", correct: "aqua" },
    { noisy: "aqau", correct: "aqua" },
    { noisy: "aqqa", correct: "aqua" },
    { noisy: "aqua-water", correct: "aqua" },
    { noisy: "aq ua", correct: "aqua" },

    // sodium benzoate
    { noisy: "sodim benzoate", correct: "sodium benzoate" },
    { noisy: "sodium benzote", correct: "sodium benzoate" },
    { noisy: "sodium benzoat", correct: "sodium benzoate" },
    { noisy: "sodium benzoatte", correct: "sodium benzoate" },
    { noisy: "sodiu benzoate", correct: "sodium benzoate" },
    { noisy: "sodum benzoate", correct: "sodium benzoate" },
    { noisy: "sodium benzoae", correct: "sodium benzoate" },
    { noisy: "sodiun benzoate", correct: "sodium benzoate" },
    { noisy: "soidum benzoate", correct: "sodium benzoate" },
    { noisy: "sodium benzoatte", correct: "sodium benzoate" },

    // dicalcium phosphate
    { noisy: "dicalcuim phosphate", correct: "dicalcium phosphate" },
    { noisy: "dicalcium phospate", correct: "dicalcium phosphate" },
    { noisy: "dicalcium phosohate", correct: "dicalcium phosphate" },
    { noisy: "dicalcium phosphae", correct: "dicalcium phosphate" },
    { noisy: "dicalcium phospaht", correct: "dicalcium phosphate" },
    { noisy: "dicaclium phosphate", correct: "dicalcium phosphate" },
    { noisy: "dicalcium phoshate", correct: "dicalcium phosphate" },
    { noisy: "dicalcium phoaphate", correct: "dicalcium phosphate" },
    { noisy: "dicalcium phoshate", correct: "dicalcium phosphate" },
    { noisy: "dicalcium phosgate", correct: "dicalcium phosphate" },

    // hydroxyapatite
    { noisy: "hydroxyapetite", correct: "hydroxyapatite" },
    { noisy: "hydroxiapatite", correct: "hydroxyapatite" },
    { noisy: "hydroxyapatitte", correct: "hydroxyapatite" },
    { noisy: "hydroxapatite", correct: "hydroxyapatite" },
    { noisy: "hydroxyapate", correct: "hydroxyapatite" },
    { noisy: "hydroxyapatit", correct: "hydroxyapatite" },
    { noisy: "hydroxyapatitw", correct: "hydroxyapatite" },
    { noisy: "hydroxylapatite", correct: "hydroxyapatite" },
    { noisy: "hydrozyapatite", correct: "hydroxyapatite" },
    { noisy: "hydroxyapqtite", correct: "hydroxyapatite" },

    // silica
    { noisy: "silca", correct: "silica" },
    { noisy: "silika", correct: "silica" },
    { noisy: "sllica", correct: "silica" },
    { noisy: "silcia", correct: "silica" },
    { noisy: "siluca", correct: "silica" },
    { noisy: "slica", correct: "silica" },
    { noisy: "siilca", correct: "silica" },
    { noisy: "silicca", correct: "silica" },
    { noisy: "silicz", correct: "silica" },
    { noisy: "sillca", correct: "silica" },

    // sorbitol
    { noisy: "sorbitul", correct: "sorbitol" },
    { noisy: "sorbtol", correct: "sorbitol" },
    { noisy: "sorbitl", correct: "sorbitol" },
    { noisy: "sorbitool", correct: "sorbitol" },
    { noisy: "sorbirol", correct: "sorbitol" },
    { noisy: "sorbutol", correct: "sorbitol" },
    { noisy: "sorvitol", correct: "sorbitol" },
    { noisy: "sorbtol", correct: "sorbitol" },
    { noisy: "sorbitok", correct: "sorbitol" },
    { noisy: "sorbito1", correct: "sorbitol" },

    // sodium fluoride
    { noisy: "sodim floride", correct: "sodium fluoride" },
    { noisy: "sodium florid", correct: "sodium fluoride" },
    { noisy: "sodium floruide", correct: "sodium fluoride" },
    { noisy: "sodiu fluoride", correct: "sodium fluoride" },
    { noisy: "sodium flouride", correct: "sodium fluoride" },
    { noisy: "sodium fluride", correct: "sodium fluoride" },
    { noisy: "soidum fluoride", correct: "sodium fluoride" },
    { noisy: "sodium fluroide", correct: "sodium fluoride" },
    { noisy: "sodium fluoried", correct: "sodium fluoride" },
    { noisy: "sodim flouride", correct: "sodium fluoride" },

    // cellulose gum
    { noisy: "celluose gum", correct: "cellulose gum" },
    { noisy: "celluloes gum", correct: "cellulose gum" },
    { noisy: "cellulos gum", correct: "cellulose gum" },
    { noisy: "cellulose gumm", correct: "cellulose gum" },
    { noisy: "cullose gum", correct: "cellulose gum" },
    { noisy: "celloose gum", correct: "cellulose gum" },
    { noisy: "cellulo gum", correct: "cellulose gum" },
    { noisy: "celulose gum", correct: "cellulose gum" },
    { noisy: "cellulose guum", correct: "cellulose gum" },
    { noisy: "celllulose gum", correct: "cellulose gum" },

    // potassium hydroxide
    { noisy: "potasium hydroxide", correct: "potassium hydroxide" },
    { noisy: "potassium hidroxide", correct: "potassium hydroxide" },
    { noisy: "potassium hydroxde", correct: "potassium hydroxide" },
    { noisy: "potassium hydrozide", correct: "potassium hydroxide" },
    { noisy: "potassium hydrokside", correct: "potassium hydroxide" },
    { noisy: "potassium hydoxide", correct: "potassium hydroxide" },
    { noisy: "potassum hydroxide", correct: "potassium hydroxide" },
    { noisy: "potassium hydroxid", correct: "potassium hydroxide" },
    { noisy: "potassiu hydroxide", correct: "potassium hydroxide" },
    { noisy: "potassium hyddroxide", correct: "potassium hydroxide" },

    // phosphoric acid
    { noisy: "phosporic acid", correct: "phosphoric acid" },
    { noisy: "phoshoric acid", correct: "phosphoric acid" },
    { noisy: "phosphoic acid", correct: "phosphoric acid" },
    { noisy: "phosphoric acd", correct: "phosphoric acid" },
    { noisy: "phosphoric acic", correct: "phosphoric acid" },
    { noisy: "phoshporic acid", correct: "phosphoric acid" },
    { noisy: "phosphoric aciid", correct: "phosphoric acid" },
    { noisy: "phosporc acid", correct: "phosphoric acid" },
    { noisy: "phosphoic acis", correct: "phosphoric acid" },
    { noisy: "phosphoric ac1d", correct: "phosphoric acid" },

    // benzyl alcohol
    { noisy: "benzl alcohol", correct: "benzyl alcohol" },
    { noisy: "benzyl alchol", correct: "benzyl alcohol" },
    { noisy: "benzyl alchohol", correct: "benzyl alcohol" },
    { noisy: "benxyl alcohol", correct: "benzyl alcohol" },
    { noisy: "benzyl alcouol", correct: "benzyl alcohol" },
    { noisy: "benzyl alc0hol", correct: "benzyl alcohol" },
    { noisy: "benyl alcohol", correct: "benzyl alcohol" },
    { noisy: "benzyl alcholol", correct: "benzyl alcohol" },
    { noisy: "benzyl akcohol", correct: "benzyl alcohol" },
    { noisy: "benzyl alchhol", correct: "benzyl alcohol" },

    // titanium dioxide
    { noisy: "titanum dioxide", correct: "titanium dioxide" },
    { noisy: "titanium dioxde", correct: "titanium dioxide" },
    { noisy: "titanium dioxie", correct: "titanium dioxide" },
    { noisy: "titamium dioxide", correct: "titanium dioxide" },
    { noisy: "titanium dixoxide", correct: "titanium dioxide" },
    { noisy: "titanum dioxde", correct: "titanium dioxide" },
    { noisy: "titaium dioxide", correct: "titanium dioxide" },
    { noisy: "titanium diox1de", correct: "titanium dioxide" },
    { noisy: "titanium dioxede", correct: "titanium dioxide" },
    { noisy: "titanium diozide", correct: "titanium dioxide" },

    // sodium hydroxide
    { noisy: "sodum hydroxide", correct: "sodium hydroxide" },
    { noisy: "sodiun hydroxide", correct: "sodium hydroxide" },
    { noisy: "sodium hydroxde", correct: "sodium hydroxide" },
    { noisy: "sodium hydoxide", correct: "sodium hydroxide" },
    { noisy: "sodium hydorxide", correct: "sodium hydroxide" },
    { noisy: "soduim hydroxide", correct: "sodium hydroxide" },
    { noisy: "sodium hydrokside", correct: "sodium hydroxide" },
    { noisy: "sodium hydrxoide", correct: "sodium hydroxide" },
    { noisy: "sodium hydyoxide", correct: "sodium hydroxide" },
    { noisy: "sodium hxdroxide", correct: "sodium hydroxide" },

    // arginine
    { noisy: "arginin", correct: "arginine" },
    { noisy: "argnine", correct: "arginine" },
    { noisy: "argninee", correct: "arginine" },
    { noisy: "argimine", correct: "arginine" },
    { noisy: "arigine", correct: "arginine" },
    { noisy: "argnime", correct: "arginine" },
    { noisy: "argiinine", correct: "arginine" },
    { noisy: "arginie", correct: "arginine" },
    { noisy: "argninne", correct: "arginine" },
    { noisy: "arg1nine", correct: "arginine" },

    // poloxamer 407
    { noisy: "poloxamer 4070", correct: "poloxamer 407" },
    { noisy: "poloxmer 407", correct: "poloxamer 407" },
    { noisy: "polaxomer 407", correct: "poloxamer 407" },
    { noisy: "poloxamer407", correct: "poloxamer 407" },
    { noisy: "poloxamer 47", correct: "poloxamer 407" },
    { noisy: "poloxamerr 407", correct: "poloxamer 407" },
    { noisy: "poloxam er 407", correct: "poloxamer 407" },
    { noisy: "poloxamerr407", correct: "poloxamer 407" },
    { noisy: "poloxamer 40z", correct: "poloxamer 407" },
    { noisy: "poloxmaer 407", correct: "poloxamer 407" },

    // calcium silicate
    { noisy: "calcuim silicate", correct: "calcium silicate" },
    { noisy: "calcium silcate", correct: "calcium silicate" },
    { noisy: "caclcium silicate", correct: "calcium silicate" },
    { noisy: "calcium silikate", correct: "calcium silicate" },
    { noisy: "calcium silicatte", correct: "calcium silicate" },
    { noisy: "calcium slicate", correct: "calcium silicate" },
    { noisy: "calcium siliacte", correct: "calcium silicate" },
    { noisy: "calcium s1licate", correct: "calcium silicate" },
    { noisy: "calccium silicate", correct: "calcium silicate" },
    { noisy: "calcium siliacte", correct: "calcium silicate" },

    // olaflur
    { noisy: "olaflurr", correct: "olaflur" },
    { noisy: "olafluur", correct: "olaflur" },
    { noisy: "olaflur ", correct: "olaflur" },
    { noisy: "olaflue", correct: "olaflur" },
    { noisy: "olaflurrr", correct: "olaflur" },
    { noisy: "olaflurr", correct: "olaflur" },
    { noisy: "0laflur", correct: "olaflur" },
    { noisy: "olaflur-", correct: "olaflur" },
    { noisy: "olaflu", correct: "olaflur" },
    { noisy: "olaflurx", correct: "olaflur" },
];
async function runFuzzyIngredientTest(ingredients = ingredientTestCases) {
    resetFuzzyCache();

    const results = [];

    for (const noisy of ingredients) {
        const match = await fuzzyFindSimilarIngredient(noisy.noisy);

        if (!match) {
            results.push({ noisy, detected: null, correct: false });
            console.log(`! "${noisy}" --> null`);
            continue;
        }

        const detected = match.name.toLowerCase();
        const correct = detected.includes(noisy.correct.toLowerCase()) || noisy.correct.toLowerCase().includes(detected)
        results.push({ noisy, detected, correct });

        console.log(
            `${correct ? "+" : "-"} "noisy: ${noisy.noisy}" | detected: "${detected} | correct: ${noisy.correct}"`,
        );
    }

    // Summary
    const correctCount = results.filter((r) => r.correct).length;
    const nullCount = results.filter((r) => r.detected === null).length;

    console.log("\n---- Test Summary ----");
    console.log("Total tests:", results.length);
    console.log("Correct matches:", correctCount);
    console.log("Null (no match):", nullCount);
    console.log(
        "Accuracy:",
        ((correctCount / results.length) * 100).toFixed(1) + "%",
    );

    console.log("\nDone.\n");
}


//runFuzzyIngredientTest();