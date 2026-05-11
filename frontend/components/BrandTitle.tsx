import Image from "next/image";
import { Group, Title } from "@mantine/core";

type BrandTitleProps = {
	order?: 1 | 2 | 3 | 4 | 5 | 6;
};

export function BrandTitle({ order = 1 }: BrandTitleProps) {
	return (
		<Group gap="xs" align="center" wrap="nowrap">
			<Image
				src="/dartmouth-d-pine.png"
				alt=""
				width={38}
				height={39}
				aria-hidden="true"
				style={{ flexShrink: 0 }}
			/>
			<Title order={order}>Dartmouth Hugh</Title>
		</Group>
	);
}
