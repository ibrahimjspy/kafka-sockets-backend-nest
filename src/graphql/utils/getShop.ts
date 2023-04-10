/**
 * @description : take shop fields and returns values of that field in shop
 */
export const getShopFieldValues = (fields, fieldName: string) => {
  let fieldValues = [];
  if (fields.map) {
    fields.map((field) => {
      if (field.name == fieldName) {
        fieldValues = field.values;
      }
    });
  }
  return fieldValues;
};
