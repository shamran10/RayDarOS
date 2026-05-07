"use client";

import AtlaskitSelect from "@atlaskit/select";
import type { OptionType, SelectProps } from "@atlaskit/select";

export default function AppleSelect<Option extends unknown = OptionType, IsMulti extends boolean = false>(
  props: SelectProps<Option, IsMulti>
) {
  return <AtlaskitSelect menuPosition="fixed" {...props} />;
}
