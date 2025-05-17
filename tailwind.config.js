/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./scripts/*.js"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        gray: {
          0: "rgb(247, 249, 252)",
          1: "rgb(233, 237, 245)",
        },
        indigo: {
          0: "rgb(237, 237, 252)",
        },
        green: {
          0: "rgb(225, 252, 239)",
        },
        red: {
          0: "rgb(255, 237, 239)",
        },
        orange: {
          0: "rgb(252, 242, 230)",
        },
      },
      boxShadow: {
        primaryButtonDefault:
          "0px 0px 0px 1px rgb(94, 90, 219),0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        primaryButtonHover:
          "0px 0px 0px 1px rgb(73, 69, 196),0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        primaryButtonActive:
          "0px 0px 0px 4px rgba(94, 90, 219, 0.4),0px 0px 0px 1px rgb(94, 90, 219),0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        primaryButtonDisabled:
          "0px 0px 0px 1px rgb(158, 155, 245),0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        secondaryButtonDefault:
          "0px 0px 0px 1px rgba(70, 79, 96, 0.16),0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        secondaryButtonHover:
          "0px 0px 0px 1px rgba(70, 79, 96, 0.32),0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        secondaryButtonActive:
          "0px 0px 0px 4px rgba(94, 90, 219, 0.4),0px 0px 0px 1px rgba(70, 79, 96, 0.32),0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        secondaryButtonDisabled: "0px 0px 0px 1px rgba(70, 79, 96, 0.2)",
        dangerButtonDefault:
          "0px 0px 0px 1px rgb(209, 41, 61),0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        dangerButtonHover:
          "0px 0px 0px 1px rgb(186, 27, 46),0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        dangerButtonActive:
          "0px 0px 0px 4px rgba(94, 90, 219, 0.4),0px 0px 0px 1px rgb(209, 41, 61),0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        primaryInputDefault:
          "0px 0px 0px 1px rgba(134, 143, 160, 0.16),0px 1px 2px 0px rgba(0, 0, 0, 0.06)",
        primaryInputHover:
          "0px 0px 0px 1px rgba(134, 143, 160, 0.4),0px 1px 2px 0px rgba(0, 0, 0, 0.06)",
        primaryInputFocus:
          "0px 0px 0px 4px rgba(94, 90, 219, 0.4),0px 0px 0px 1px rgba(134, 143, 160, 0.32),0px 1px 2px 0px rgba(0, 0, 0, 0.06)",
        checkboxDefault:
          "0px 0px 0px 1px rgba(70, 79, 96, 0.16), 0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        checkboxHover:
          "0px 0px 0px 1px rgba(70, 79, 96, 0.32), 0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        checkboxActive:
          "0px 0px 0px 4px rgba(94, 90, 219, 0.4), 0px 0px 0px 1px rgba(70, 79, 96, 0.32), 0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        checkboxDisabled: "0px 0px 0px 1px rgba(70, 79, 96, 0.2)",
        statusUpdateForm: "0 4px 20px rgba(0, 0, 0, 0.1)",
        dropdownActions:
          "0px 5px 15px 0px rgba(0, 0, 0, 0.08), 0px 15px 35px -5px rgba(17, 24, 38, 0.15), 0px 0px 0px 1px rgba(152, 161, 179, 0.1)",
        toastMessage:
          "0px 5px 15px 0px rgba(0, 0, 0, 0.25),0px 15px 35px -5px rgba(17, 24, 38, 0.5),0px 0px 0px 0.5px rgba(255, 255, 255, 0.4)",
        deletionForm:
          "0px 10px 30px 0px #00000033, 0px 30px 70px -10px #11182640, 0px 0px 0px 1px #98A1B21A",
        projectForm:
          "0px 10px 30px 0px rgba(0, 0, 0, 0.2), 0px 30px 70px 0px rgba(26, 34, 64, 0.15), 0px 0px 0px 1px rgba(136, 143, 170, 0.1)",
        managerRadioInputChecked:
          "0px 2px 6px 0px rgba(0, 0, 0, 0.25),0px 0px 0px 0.5px rgba(0, 0, 0, 0.08)",
        resourceCheckboxDefault:
          "0px 0px 0px 1px rgba(70, 79, 96, 0.1), 0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        resourceCheckboxDefaultHover:
          "0px 0px 0px 1px rgba(70, 79, 96, 0.16), 0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        resourceCheckboxDefaultActive:
          "0px 0px 0px 1px rgba(70, 79, 96, 0.32), 0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        resourceCheckboxChecked:
          "0px 0px 0px 1px rgb(94, 90, 219), 0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        resourceCheckboxCheckedHover:
          "0px 0px 0px 1px rgb(73, 69, 196), 0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        resourceCheckboxCheckedActive:
          "0px 0px 0px 4px rgba(94, 90, 219, 0.4), 0px 0px 0px 1px rgb(94, 90, 219), 0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
