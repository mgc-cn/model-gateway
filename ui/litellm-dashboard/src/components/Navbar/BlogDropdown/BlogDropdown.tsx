import { useDisableBlogPosts } from "@/app/(dashboard)/hooks/useDisableBlogPosts";
import { useBlogPosts, type BlogPost } from "@/app/(dashboard)/hooks/blogPosts/useBlogPosts";
import { NAV_PRODUCT_LINK_CLASS } from "@/components/Navbar/navProductLinkClass";
import { DownOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Dropdown, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";

const { Text, Title, Paragraph } = Typography;

export const BlogDropdown: React.FC = () => {
  const disableBlogPosts = useDisableBlogPosts();
  const { t, i18n } = useTranslation();

  const { data, isLoading, isError, refetch } = useBlogPosts();

  if (disableBlogPosts) {
    return null;
  }

  let items: MenuProps["items"];

  if (isLoading) {
    items = [{ key: "loading", label: <LoadingOutlined />, disabled: true }];
  } else if (isError) {
    items = [
      {
        key: "error",
        label: (
          <Space>
            <Text type="danger">{t("navigation.blogLoadFailed")}</Text>
            <Button size="small" onClick={() => refetch()}>
              {t("common.retry")}
            </Button>
          </Space>
        ),
        disabled: true,
      },
    ];
  } else if (!data || data.posts.length === 0) {
    items = [{ key: "empty", label: <Text type="secondary">{t("navigation.noBlogPosts")}</Text>, disabled: true }];
  } else {
    items = [
      ...data.posts.slice(0, 5).map((post: BlogPost) => ({
        key: post.url,
        label: (
          <a href={post.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", width: 380 }}>
            <Title level={5} style={{ marginBottom: 2 }}>
              {post.title}
            </Title>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {new Date(post.date + "T00:00:00").toLocaleDateString(i18n.resolvedLanguage, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
            <Paragraph ellipsis={{ rows: 2 }}>{post.description}</Paragraph>
          </a>
        ),
      })),
      { type: "divider" as const },
      {
        key: "view-all",
        label: (
          <a href="https://docs.litellm.ai/blog" target="_blank" rel="noopener noreferrer">
            {t("navigation.viewAllBlogPosts")}
          </a>
        ),
      },
    ];
  }

  // Blog opens a post list; Docs is a single outbound link — navbar adds a layout-only chevron there for alignment.
  return (
    <Dropdown menu={{ items }} trigger={["hover"]} placement="bottomRight">
      <Button type="text" className={`${NAV_PRODUCT_LINK_CLASS} border-0! bg-transparent!`}>
        {t("navigation.blog")}
        <DownOutlined className="text-[10px] text-gray-500" aria-hidden />
      </Button>
    </Dropdown>
  );
};

export default BlogDropdown;
