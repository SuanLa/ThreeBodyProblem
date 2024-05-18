import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';

import "../css/App.css";

export default function Navigation({chargeOpen}) {

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar className={"subColor"}>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="open drawer"
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon onClick={chargeOpen}/>
                    </IconButton>
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={{ display: { xs: 'none', sm: 'block' } }}
                    >
                        Three
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Box sx={{display: {xs: 'none', md: 'flex'}}}>
                        <input
                            type="checkbox"
                            className="sr-only"
                            id="darkmode-toggle"
                        />
                        <label htmlFor="darkmode-toggle" className="toggle">
                            <span>Toggle dark mode</span>
                        </label>
                    </Box>
                </Toolbar>
            </AppBar>
        </Box>
    );
}