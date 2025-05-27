const buttons = document.querySelectorAll(".text-black.tkp-level-button");

const GraphicsCoverage = _ref => {
  var {
    tabNum,
    setOption,
    pricesData,
    isFrench
  } = _ref;
  var [attributes, setConfiguration] = hooks_useAttributes();
  var metadata = hooks_useMetadata();

  var handleClick = id => {
    var show = attributes[id].value === 'Yes' ? 'No' : 'Yes';
    setConfiguration({
      [attributes[id].name]: show
    });
  };

  var buttonsLevel = getLevelsNames(attributes).map(levelName => {
    var priceRef = null;
    var find = pricesData.find(el => el.title.toLowerCase().includes(levelName.toLowerCase()));

    if (find !== undefined) {
      priceRef = formatMoney(find.currentVariant.price).toFixed(2);
    }

    return {
      id: levelName,
      text: isFrench ? "".concat(titles.LEVEL.FR, " ").concat(levelName.substr(levelName.length - 1)) : "".concat(titles.LEVEL.EN, " ").concat(levelName.substr(levelName.length - 1)),
      price: priceRef,
      selected: attributes[levelName].value === 'Yes' ? true : false,
      onclick: handleClick,
      isDisabled: attributes[levelName].value === 'No'
    };
  });
  var tooltipGraphicsCoverage = metadata && metadata.hasOwnProperty('graphics_coverage_tooltip') ? metadata['graphics_coverage_tooltip'] : null;
  var isSwitch = metadata && metadata.hasOwnProperty('is_switch') ? metadata['is_switch'] : false;
  return /*#__PURE__*/react.createElement("div", {
    className: "flex flex-col"
  }, /*#__PURE__*/react.createElement(titleBase, {
    title: isFrench ? titles.GRAPHICS_COVERAGE.FR : titles.GRAPHICS_COVERAGE.EN,
    tooltip: true,
    textTooltip: tooltipGraphicsCoverage
  }), /*#__PURE__*/react.createElement(levelButton, {
    buttons: isSwitch ? buttonsLevel.filter(button => !button.isDisabled) : buttonsLevel
  }), /*#__PURE__*/react.createElement("div", {
    className: "mt-2 border-solid border border-gray-200"
  }), /*#__PURE__*/react.createElement(bottomNavigation, {
    hasPrevious: true,
    onForwardClick: () => setOption(tabNum + 1),
    onBackClick: () => setOption(tabNum - 1),
    isFrench: isFrench
  }), /*#__PURE__*/react.createElement("div", {
    className: "mt-2 border-solid border border-gray-200"
  }));
};
