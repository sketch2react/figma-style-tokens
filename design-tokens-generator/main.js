// This file is manually written.
const { mockRapidAPIResponse } = require("./mock");
const { convertName, rgbHex } = require("./utils");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

require("dotenv").config();

const getData = async () => {
  const options = {
    method: "POST",
    url: "https://figma-style-tokens.p.rapidapi.com/v1/figma/styles",
    headers: {
      "content-type": "application/json",
      "X-Figma-Token": "figd_G9_HOIEF8RQkZLO0HIxYBGddDJS-Xi-Y8-CSKBYz",
      "X-RapidAPI-Key": process.env.YOUR_RAPID_API_KEY,
      "X-RapidAPI-Host": "figma-style-tokens.p.rapidapi.com",
    },
    data: '{"documentId":"vngGVfaNol7Fur8qNO05we"}',
  };

  try {
    const res = await axios.request(options);
    return res.data;
  } catch (error) {
    return {
      colors: {},
      effects: {},
      texts: {},
      grids: {},
    };
  }
};

const getStyles = async () => {
  // const data = mockRapidAPIResponse in case you want to use mocked data
  const data = await getData();
  const colors = data.colors;
  const effects = data.effects;
  const texts = data.texts;
  const grids = data.grids;

  const styleDColor = {
    color: {
      base: {},
    },
  };

  const styleDSize = {
    size: {},
  };

  const styleDFont = {
    font: {},
  };

  const styleDShadow = {
    shadow: {},
  };

  const styleDGrid = {
    grid: {},
  };

  Object.keys(colors).forEach((key) => {
    const currentColor = colors[key];
    const name = convertName(key);
    if (currentColor.fills.length > 1) {
      currentColor.fills.forEach((c, i) => {
        if (
          c.type !== "GRADIENT_LINEAR" &&
          c.type !== "GRADIENT_DIAMOND" &&
          c.type !== "GRADIENT_ANGULAR" &&
          c.type !== "IMAGE"
        ) {
          styleDColor.color.base[`${name}-${i + 1}`] = {
            value: rgbHex(c.color.r, c.color.g, c.color.b, c.color.a),
            comment: currentColor.description,
          };
        }
      });
    } else {
      const c = currentColor.fills[0];

      if (
        c.type !== "GRADIENT_LINEAR" &&
        c.type !== "GRADIENT_DIAMOND" &&
        c.type !== "GRADIENT_ANGULAR" &&
        c.type !== "IMAGE"
      ) {
        styleDColor.color.base[name] = {
          value: rgbHex(c.color.r, c.color.g, c.color.b, c.color.a),
          comment: currentColor.description,
        };
      }
    }
  });

  Object.keys(effects).forEach((key) => {
    const currentEffect = effects[key];
    const name = convertName(key);
    if (currentEffect.effects.length > 1) {
      currentEffect.effects.forEach((c, i) => {
        styleDShadow.shadow[`${name}-${i + 1}`] = {
          value: `${c.offset.x}px ${c.offset.y}px ${c.radius}px ${rgbHex(
            c.color.r,
            c.color.g,
            c.color.b,
            c.color.a
          )}`,
          comment: currentEffect.description,
        };
      });
    } else {
      const c = currentEffect.effects[0];

      if (c.type !== "LAYER_BLUR" && c.type !== "BACKGROUND_BLUR") {
        styleDShadow.shadow[name] = {
          value: `${c.offset.x}px ${c.offset.y}px ${c.radius}px ${rgbHex(
            c.color.r,
            c.color.g,
            c.color.b,
            c.color.a
          )}`,
          comment: currentEffect.description,
        };
      }
    }
  });

  Object.keys(texts).forEach((key) => {
    const currentText = texts[key];
    const name = convertName(key);
    styleDSize.size[name] = {
      font: { value: currentText.fontSize / 16 },
      lineHeight: { value: currentText.lineHeightPx / 16 },
      weight: { value: currentText.fontWeight },
      letterSpacing: { value: currentText.letterSpacing / 16 },
    };
    styleDFont.font[name] = {
      family: {
        value: `${currentText.fontFamily}${
          !!currentText.fontPostScriptName
            ? ", " + currentText.fontPostScriptName
            : ""
        }`,
      },
    };
  });

  Object.keys(grids).forEach((key) => {
    const currentGrid = grids[key];
    const name = convertName(key);
    const c = currentGrid.layoutGrids[0];

    styleDGrid.grid[name] = {
      color: { value: rgbHex(c.color.r, c.color.g, c.color.b, c.color.a) },
      sectionSize: { value: c.sectionSize },
      gutterSize: { value: c.gutterSize },
    };
  });

  fs.writeFileSync(
    path.join(__dirname, "tokens/tokens.json"),
    JSON.stringify({
      ...styleDColor,
      ...styleDSize,
      ...styleDShadow,
      ...styleDGrid,
      ...styleDFont,
    })
  );
  const StyleDictionary = require("style-dictionary");

  StyleDictionary.registerTransform({
    name: "size/weight",
    type: "value",
    matcher: function (prop) {
      return prop.attributes.item === "weight";
    },
    transformer: function (prop) {
      return prop.original.value;
    },
  });

  StyleDictionary.registerTransform({
    name: "shadow",
    type: "value",
    matcher: function (prop) {
      return prop.attributes.category === "shadow";
    },
    transformer: function (prop) {
      return prop.original.value;
    },
  });

  StyleDictionary.registerTransform({
    name: "grid/size",
    type: "value",
    matcher: function (prop) {
      return (
        prop.attributes.category === "grid" &&
        prop.attributes.item === "sectionSize"
      );
    },
    transformer: function (prop) {
      return `${prop.original.value}px`;
    },
  });

  StyleDictionary.registerTransform({
    name: "grid/gutter",
    type: "value",
    matcher: function (prop) {
      return (
        prop.attributes.category === "grid" &&
        prop.attributes.item === "gutterSize"
      );
    },
    transformer: function (prop) {
      return `${prop.original.value}px`;
    },
  });

  StyleDictionary.registerTransform({
    name: "font",
    type: "value",
    matcher: function (prop) {
      return prop.attributes.category === "font";
    },
    transformer: function (prop) {
      return prop.original.value;
    },
  });

  StyleDictionary.registerTransformGroup({
    name: "custom/scss",
    transforms: StyleDictionary.transformGroup["scss"].concat([
      "size/weight",
      "shadow",
      "grid/size",
      "grid/gutter",
      "font",
    ]),
  });

  const StyleDictionaryExtended = StyleDictionary.extend(
    path.join(__dirname, "config.json")
  );
  StyleDictionaryExtended.buildAllPlatforms();
};

getStyles();
