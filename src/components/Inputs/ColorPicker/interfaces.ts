export interface IColorPickerProps {
  onChange: (color: string) => void;
  color?: string;
  label?: string;
  hoverLabel?: string;
  wrapText?: boolean;
  colors?: string[];
  disableEntry?: boolean;
  disableColorLabel?: boolean;
}
