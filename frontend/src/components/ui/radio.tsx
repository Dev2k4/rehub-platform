import { RadioGroup as ChakraRadioGroup } from "@chakra-ui/react";
import * as React from "react";

export const RadioGroup = ChakraRadioGroup.Root;

export const Radio = React.forwardRef<
  HTMLInputElement,
  ChakraRadioGroup.ItemProps
>(function Radio(props, ref) {
  const { children, ...rest } = props;
  return (
    <ChakraRadioGroup.Item ref={ref} {...rest}>
      <ChakraRadioGroup.ItemHiddenInput />
      <ChakraRadioGroup.ItemControl />
      {children && (
        <ChakraRadioGroup.ItemText>{children}</ChakraRadioGroup.ItemText>
      )}
    </ChakraRadioGroup.Item>
  );
});