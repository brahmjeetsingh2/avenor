const apiResponse = {
  success: (res, data = {}, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  },

  error: (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
    const response = { success: false, message };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  },

  paginated: (res, data, pagination, message = 'Success') => {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
    });
  },
};

module.exports = apiResponse;
