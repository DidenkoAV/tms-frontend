import { IconBase } from "./IconBase";

export default function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 4v12"
      />
    </IconBase>
  );
}
