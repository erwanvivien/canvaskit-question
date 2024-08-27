import "./style.css";

function assertDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error("Value is undefined");
  }
}

const main = async () => {};

main();
