import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { gql } from 'apollo-boost';
import { useQuery } from '@apollo/react-hooks';
import { Grid, CircularProgress } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import Volunteers from './Volunteers';

const VOLUNTEERS_QUERY = gql`
  query Get($cursor: Int) {
    users(cursor: $cursor) {
      id
      firstName
      lastName
      email
    }
    userAggregates {
      totalCount
    }
  }
`;

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%'
  },
  paper: {
    width: '100%',
    marginBottom: theme.spacing(2)
  },
  table: {
    minWidth: 750
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1
  },
  loader: {
    paddingTop: '40px',
    display: 'flex',
    justifyContent: 'center'
  }
}));

const VolunteersContainer = () => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = React.useState('id');
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const classes = useStyles();
  const { loading, error, data, fetchMore } = useQuery(VOLUNTEERS_QUERY);

  const handleRequestSort = (event, property) => {
    const isDesc = orderBy === property && order === 'desc';
    setOrder(isDesc ? 'asc' : 'desc');
    setOrderBy(property);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleSelectAllClick = event => {
    if (event.target.checked) {
      const newSelecteds = data.users.map(n => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleChangePage = (event, newPage) => {
    fetchMore({
      query: VOLUNTEERS_QUERY,
      variables: { cursor: (page + 1) * rowsPerPage },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        let appendUsers = [];
        const previousUserIds = previousResult.users.map(u => u.id);

        // probably a better way to do this
        // adds new user only if the user id
        // exists in the previous result
        fetchMoreResult.users.forEach(u => {
          if (!previousUserIds.includes(u.id)) {
            appendUsers = [...appendUsers, u];
          }
        });

        return {
          users: [...previousResult.users, ...appendUsers]
        };
      }
    });

    setPage(newPage);
  };

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading)
    return (
      <Grid item xs={12} className={classes.loader}>
        <CircularProgress />
      </Grid>
    );

  if (error)
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        An error occured while retrieving users. Please try again.
      </Alert>
    );

  const isSelected = name => selected.indexOf(name) !== -1;

  return (
    <Volunteers
      handleSelectAllClick={handleSelectAllClick}
      handleRequestSort={handleRequestSort}
      classes={classes}
      selected={selected}
      order={order}
      orderBy={orderBy}
      data={data}
      page={page}
      rowsPerPage={rowsPerPage}
      isSelected={isSelected}
      handleClick={handleClick}
      handleChangePage={handleChangePage}
      handleChangeRowsPerPage={handleChangeRowsPerPage}
      totalUsers={data.userAggregates.totalCount}
    />
  );
};

export default VolunteersContainer;
