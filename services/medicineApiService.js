const axios = require("axios");

const searchMedicine = async (itemName) => {
  const response = await axios.get(
    "https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList",
    {
      params: {
        serviceKey: process.env.MEDICINE_API_KEY,
        pageNo: 1,
        numOfRows: 10,
        itemName,
        type: "json",
      },
    },
  );

  return response.data;
};

const searchIngredients = async (medicineName) => {
  const response = await axios.get(
    "https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService07/getDrugPrdtMcpnDtlInq07",
    {
      params: {
        serviceKey: process.env.INGREDIENT_API_KEY,
        pageNo: 1,
        numOfRows: 20,
        type: "json",
        Prduct: medicineName,
      },
    },
  );

  return response.data;
};

module.exports = {
  searchMedicine,
  searchIngredients
};
