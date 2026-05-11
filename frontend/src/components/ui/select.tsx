import { Select as ChakraSelect } from "@chakra-ui/react";
import * as React from "react";

export const SelectTrigger = ChakraSelect.Trigger;
export const SelectContent = ChakraSelect.Content;
export const SelectItem = ChakraSelect.Item;
export const SelectLabel = ChakraSelect.Label;
export const SelectValueText = ChakraSelect.ValueText;

export const SelectRoot = React.forwardRef<
  HTMLDivElement,
  ChakraSelect.RootProps
>(function SelectRoot(props, ref) {
  return (
    <ChakraSelect.Root
      {...props}
      ref={ref}
      positioning={{ sameWidth: true, ...props.positioning }}
    >
      {props.children}
    </ChakraSelect.Root>
  );
});