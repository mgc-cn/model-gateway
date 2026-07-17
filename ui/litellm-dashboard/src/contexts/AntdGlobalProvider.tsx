"use client";

import React, { useEffect, useRef } from "react";
import { ConfigProvider, notification, message } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
import { setNotificationInstance } from "@/components/molecules/notifications_manager";
import { setMessageInstance } from "@/components/molecules/message_manager";
import { normalizeLocale } from "@/i18n/config";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { useTranslation } from "react-i18next";

export default function AntdGlobalProvider({ children }: { children: React.ReactNode }) {
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const [messageApi, messageContextHolder] = message.useMessage();
  const initialized = useRef(false);
  const { i18n } = useTranslation();
  const locale = normalizeLocale(i18n.resolvedLanguage) ?? "zh-CN";
  const antdLocale = locale === "zh-CN" ? zhCN : enUS;

  useEffect(() => {
    if (!initialized.current) {
      setNotificationInstance(notificationApi);
      setMessageInstance(messageApi);
      initialized.current = true;
    }
  }, [notificationApi, messageApi]);

  useEffect(() => {
    dayjs.locale(locale === "zh-CN" ? "zh-cn" : "en");
  }, [locale]);

  return (
    <StyleProvider layer>
      <ConfigProvider locale={antdLocale} theme={{ cssVar: true }}>
        {notificationContextHolder}
        {messageContextHolder}
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}
