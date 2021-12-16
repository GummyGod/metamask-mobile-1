import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { useAppThemeFromContext } from '../../../util/theme';

interface Props {
	/**
	 * The height of the LogoWord as a number
	 */
	height: number;
	/**
	 * The width of the LogoWord as a number
	 */
	width: number;
	/**
	 * The fill color of the LogoWord accepts any value svg fill attribute accepts e.g. hex, rgb
	 */
	fill: string;
}

const LogoWord = ({ width = 90, height = 12, fill }: Props) => {
	const { colors } = useAppThemeFromContext();
	return (
		<Svg width={width} height={height}>
			<Path
				fill={fill || colors.textDefault}
				d="M75.514 5.764c-.644-.426-1.355-.73-2.028-1.109-.437-.246-.901-.464-1.28-.777-.645-.531-.512-1.574.16-2.03.968-.644 2.57-.284 2.74 1.034 0 .029.03.048.058.048h1.46c.038 0 .066-.029.057-.067-.076-.91-.427-1.668-1.072-2.152A3.39 3.39 0 0 0 73.543 0c-3.86 0-4.21 4.086-2.134 5.376.237.151 2.276 1.175 2.996 1.62.72.446.948 1.262.635 1.906-.284.588-1.024.996-1.763.949-.806-.048-1.432-.484-1.65-1.167a2.066 2.066 0 0 1-.056-.464.061.061 0 0 0-.057-.057H69.93a.061.061 0 0 0-.057.057c0 1.147.285 1.782 1.062 2.36.73.55 1.527.778 2.352.778 2.161 0 3.28-1.223 3.507-2.493.2-1.242-.17-2.361-1.28-3.1ZM6.77.209H5.3a.064.064 0 0 0-.057.037L3.944 4.532a.06.06 0 0 1-.114 0L2.531.246C2.521.218 2.503.21 2.474.21H.057A.061.061 0 0 0 0 .265v10.941c0 .029.028.057.057.057H1.64a.061.061 0 0 0 .057-.057V2.892c0-.067.095-.076.114-.02l1.308 4.314.095.304c.01.028.028.038.057.038h1.213a.064.064 0 0 0 .057-.038l.095-.304 1.308-4.313c.02-.067.114-.048.114.019v8.314c0 .029.029.057.057.057h1.583a.061.061 0 0 0 .057-.057V.266a.061.061 0 0 0-.057-.057H6.77ZM51.272.209c-.028 0-.047.019-.057.037l-1.299 4.286a.06.06 0 0 1-.113 0l-1.3-4.286c-.009-.028-.028-.037-.056-.037h-2.408a.061.061 0 0 0-.057.056v10.941c0 .029.028.057.057.057h1.583a.061.061 0 0 0 .057-.057V2.892c0-.067.095-.076.114-.02L49.1 7.187l.095.304c.01.028.028.038.057.038h1.213c.029 0 .048-.02.057-.038l.095-.304 1.308-4.313c.02-.067.114-.048.114.019v8.314c0 .029.029.057.057.057h1.583a.061.061 0 0 0 .057-.057V.266a.061.061 0 0 0-.057-.057h-2.408ZM30.85.209H23.37a.061.061 0 0 0-.057.056v1.366c0 .028.029.057.057.057h2.892v9.518c0 .029.028.057.057.057h1.583a.061.061 0 0 0 .057-.057V1.688h2.892a.061.061 0 0 0 .056-.057V.265c0-.028-.019-.056-.056-.056ZM40.189 11.263h1.441c.038 0 .066-.038.057-.076L38.71.21C38.7.18 38.682.17 38.653.17h-2.067a.064.064 0 0 0-.056.038l-2.977 10.978c-.01.038.019.076.056.076h1.441a.064.064 0 0 0 .057-.038l.863-3.195c.01-.028.029-.038.057-.038h3.185c.029 0 .048.02.057.038l.863 3.195c.01.02.038.038.057.038Zm-3.783-4.835 1.157-4.276a.06.06 0 0 1 .114 0l1.156 4.276c.01.038-.019.076-.057.076h-2.313c-.038 0-.066-.038-.057-.076ZM64.763 11.263h1.441c.038 0 .067-.038.057-.076L63.284.21c-.01-.029-.028-.038-.057-.038H61.16c-.028 0-.047.019-.056.038l-2.977 10.978c-.01.038.019.076.057.076h1.44a.064.064 0 0 0 .058-.038l.862-3.195c.01-.028.029-.038.057-.038h3.186c.028 0 .047.02.057.038l.862 3.195c.01.02.029.038.057.038ZM60.98 6.428l1.157-4.276a.06.06 0 0 1 .114 0l1.157 4.276c.009.038-.02.076-.057.076h-2.314c-.038 0-.066-.038-.057-.076ZM14.183 9.642V6.248c0-.029.029-.057.057-.057h4.22a.061.061 0 0 0 .056-.057V4.77a.061.061 0 0 0-.057-.057H14.24a.061.061 0 0 1-.057-.057V1.754c0-.028.029-.057.057-.057h4.797a.061.061 0 0 0 .057-.057V.275a.061.061 0 0 0-.057-.057h-6.494a.061.061 0 0 0-.057.057v10.931c0 .029.029.057.057.057h6.693a.061.061 0 0 0 .057-.057v-1.44a.061.061 0 0 0-.056-.058H14.23c-.029-.01-.048-.028-.048-.066ZM89.982 11.168l-5.48-5.66a.058.058 0 0 1 0-.076l4.93-5.12a.055.055 0 0 0-.038-.094h-2.02c-.018 0-.028.01-.037.019l-4.181 4.342a.055.055 0 0 1-.095-.038V.275a.061.061 0 0 0-.057-.057h-1.583a.061.061 0 0 0-.057.057v10.94c0 .03.028.058.057.058h1.583c.029 0 .057-.029.057-.057V6.4c0-.048.066-.076.095-.038l4.74 4.892c.01.01.029.019.038.019h2.02c.038-.01.066-.076.028-.105Z"
			/>
		</Svg>
	);
};

export default LogoWord;
