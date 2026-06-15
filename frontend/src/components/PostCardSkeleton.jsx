import { Card, CardContent, CardActions, Box, Skeleton, Divider } from '@mui/material';

const PostCardSkeleton = () => {
  return (
    <Card 
      sx={{ 
        mb: 1.5, 
        borderRadius: 3, 
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        border: 'none',
      }}
    >
      <CardContent sx={{ pb: 0 }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          {/* Avatar Skeleton */}
          <Skeleton variant="circular" width={44} height={44} animation="wave" />

          {/* Name + handle + time Skeleton */}
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="30%" height={18} animation="wave" />
            <Skeleton variant="text" width="20%" height={12} animation="wave" />
          </Box>
        </Box>

        {/* Text body */}
        <Skeleton variant="text" width="90%" height={16} animation="wave" sx={{ mb: 1 }} />
        <Skeleton variant="text" width="75%" height={16} animation="wave" sx={{ mb: 2 }} />

        {/* Optional Media placeholder (wave animation for premium feel) */}
        <Skeleton variant="rounded" height={160} animation="wave" sx={{ mb: 2, borderRadius: 2 }} />
      </CardContent>

      <Divider sx={{ mx: 2 }} />

      {/* Action Bar Skeletons */}
      <CardActions sx={{ px: 2, py: 1, display: 'flex', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="circular" width={20} height={20} animation="wave" />
          <Skeleton variant="text" width={24} height={14} animation="wave" />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="circular" width={20} height={20} animation="wave" />
          <Skeleton variant="text" width={24} height={14} animation="wave" />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="circular" width={20} height={20} animation="wave" />
          <Skeleton variant="text" width={24} height={14} animation="wave" />
        </Box>
      </CardActions>
    </Card>
  );
};

export default PostCardSkeleton;
