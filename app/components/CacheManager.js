import React, { useState, useEffect } from "react";
import Button from "antd/es/button";
import Card from "antd/es/card";
import Statistic from "antd/es/statistic";
import Space from "antd/es/space";
import message from "antd/es/message";
import { DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  clearAllCaches,
  getCacheInfo,
  isServiceWorkerActive
} from "../utilities/cacheManager.js";

/**
 * Cache Manager Component
 * Optional component to display cache information and allow manual cache clearing
 * Can be added to Dashboard or Settings page
 */
export default function CacheManager() {
  const [cacheInfo, setCacheInfo] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [swActive, setSwActive] = useState(false);

  useEffect(() => {
    loadCacheInfo();
    setSwActive(isServiceWorkerActive());
  }, []);

  async function loadCacheInfo() {
    const info = await getCacheInfo();
    setCacheInfo(info);
  }

  async function handleClearCache() {
    setIsClearing(true);
    try {
      const success = await clearAllCaches();
      if (success) {
        message.success("Cache cleared successfully");
        await loadCacheInfo();
        // Reload page after a delay to re-register service worker
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        message.error("Failed to clear cache");
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
      message.error("Error clearing cache");
    } finally {
      setIsClearing(false);
    }
  }

  if (!swActive) {
    return (
      <Card title="Cache Manager" style={{ marginBottom: 16 }}>
        <p>Service Worker is not active. Cache management is not available.</p>
        <p>
          <small>
            Service Workers require HTTPS or localhost. Make sure you're running the app with
            proper configuration.
          </small>
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Cache Manager"
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={loadCacheInfo}
          size="small"
          type="text"
        >
          Refresh
        </Button>
      }
      style={{ marginBottom: 16 }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {cacheInfo && (
          <Space size="large" wrap>
            <Statistic
              title="Cache Usage"
              value={cacheInfo.usageInMB}
              suffix="MB"
              precision={2}
            />
            <Statistic
              title="Available"
              value={cacheInfo.quotaInMB}
              suffix="MB"
              precision={2}
            />
            <Statistic
              title="% Used"
              value={cacheInfo.percentUsed}
              suffix="%"
              precision={2}
            />
          </Space>
        )}

        <div>
          <p style={{ marginBottom: 8, color: "#666" }}>
            <strong>About Image Caching:</strong>
          </p>
          <ul style={{ marginLeft: 20, color: "#666", fontSize: "14px" }}>
            <li>Images are cached for 7 days to improve performance</li>
            <li>Cached images load instantly without network requests</li>
            <li>Clearing cache will remove all cached images and data</li>
            <li>The page will reload after clearing cache</li>
          </ul>
        </div>

        <Button
          type="primary"
          danger
          icon={<DeleteOutlined />}
          onClick={handleClearCache}
          loading={isClearing}
          block
        >
          Clear All Cache
        </Button>
      </Space>
    </Card>
  );
}

